/*
 * Copyright 2023 Thoughtworks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import _ from "lodash";
import m from "mithril";
import Stream from "mithril/stream";
import {TaskJSON, Template} from "models/admin_templates/templates";
import {EnvironmentVariableJSON} from "models/environment_variables/types";
import {PipelineStructure} from "models/internal_pipeline_structure/pipeline_structure";
import {ArtifactJSON} from "models/pipeline_configs/artifact";
import {JobJSON} from "models/pipeline_configs/job";
import {StageJSON} from "models/pipeline_configs/stage";
import {TabJSON} from "models/pipeline_configs/tab";
import {ModelWithNameIdentifierValidator} from "models/shared/name_validation";
import {PluginInfos} from "models/shared/plugin_infos_new/plugin_info";
import * as Buttons from "views/components/buttons";
import {FlashMessage, MessageType} from "views/components/flash_message";
import {CheckboxField, SelectField, SelectFieldOptions, TextField} from "views/components/forms/input_fields";
import {Tree} from "views/components/hierarchy/tree";
import {KeyValuePair} from "views/components/key_value_pair";
import {Link} from "views/components/link";
import {Modal, Size} from "views/components/modal";
import {Tabs} from "views/components/tab";
import {Table} from "views/components/table";
import styles from "views/pages/admin_templates/modals.scss";
import {TaskWidget} from "views/pages/admin_templates/task_widget";

const inflection = require("lodash-inflection");

export class CreateTemplateModal extends Modal {
  private readonly callback: (newTemplateName: string, basedOnPipeline?: string) => void;
  private readonly template: ModelWithNameIdentifierValidator;
  private readonly basedOnPipelineCheckbox: Stream<boolean>;
  private readonly selectedPipeline: Stream<string>;
  private readonly pipelines: string[];

  constructor(pipelineStructure: PipelineStructure,
              callback: (newTemplateName: string, basedOnPipeline?: string) => void) {
    super();
    this.callback                = callback;
    this.template                = new ModelWithNameIdentifierValidator();
    this.basedOnPipelineCheckbox = Stream<boolean>(false);
    this.selectedPipeline        = Stream<string>();
    this.pipelines               = pipelineStructure.getAllConfigPipelinesNotUsingTemplates().sort((a, b) => {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });
  }

  body() {
    return (
      <div>
        <TextField property={this.template.name}
                   errorText={this.template.errors().errorsForDisplay("name")}
                   onchange={() => this.template.validate("name")}
                   required={true}
                   label={"模板名称"}/>

        <CheckboxField property={this.basedOnPipelineCheckbox}
                       label={"从算法中提取模板"}
                       helpText={"如果未选择算法，将创建一个具有默认阶段和默认作业的模板。如果选择了算法，则模板将使用算法中的阶段，并且算法本身将被修改为使用此模板。"}/>
        {this.maybeShowPipelines()}
      </div>
    );
  }

  buttons() {
    const disabled = _.isEmpty(this.template.name()) ||
      this.template.errors().hasErrors() ||
      (this.basedOnPipelineCheckbox() && _.isEmpty(this.selectedPipeline()));

    return [<Buttons.Primary data-test-id="button-create"
                             disabled={disabled}
                             onclick={this.create.bind(this)}>Create</Buttons.Primary>];
  }

  title(): string {
    return "创建新模板";
  }

  private create() {
    this.callback(this.template.name(), this.basedOnPipelineCheckbox() ? this.selectedPipeline() : undefined);
    super.close();
  }

  private maybeShowPipelines() {
    if (this.basedOnPipelineCheckbox()) {
      return (
        <SelectField property={this.selectedPipeline}
                     label={"算法"}
                     helpText={"此算法将被修改为使用新创建的模板."}>
          <SelectFieldOptions items={this.pipelines} selected={this.selectedPipeline()}/>
        </SelectField>
      );
    }
  }
}

export class ShowTemplateModal extends Modal {
  private readonly template: string;
  private readonly templateConfig: Stream<Template>;
  private readonly pluginInfos: PluginInfos;
  private selectedStage?: StageJSON;
  private selectedJob?: JobJSON;

  constructor(template: string, templateConfig: Stream<Template>, pluginInfos: PluginInfos) {
    super(Size.large);
    this.fixedHeight    = true;
    this.template       = template;
    this.templateConfig = templateConfig;
    this.pluginInfos    = pluginInfos;
    this.templateConfig();
  }

  body() {
    if (this.isLoading()) {
      return undefined;
    }

    return (
      <div class={styles.parent}>
        <div data-test-id="stage-job-tree" class={styles.stageJobTree}>
          {this.templateConfig().stages.map((eachStage) => {
            const stageLink = (
              <Link href="#" onclick={() => {
                this.selectStage(eachStage);
                return false;
              }}>{eachStage.name}</Link>
            );
            return (
              <Tree datum={stageLink}>
                {eachStage.jobs.map((eachJob) => {
                  const jobLink = (
                    <Link href="#" onclick={() => {
                      this.selectJob(eachStage, eachJob);
                      return false;
                    }}>{eachJob.name}</Link>
                  );
                  return (
                    <Tree datum={jobLink}/>
                  );
                })}
              </Tree>);
          })}
        </div>

        {this.showSelection()}
      </div>
    );
  }

  title(): string {
    return `显示模板 ${this.template}`;
  }

  private selectStage(eachStage: StageJSON) {
    this.selectedStage = eachStage;
    this.selectedJob   = undefined;
  }

  private selectJob(eachStage: StageJSON, eachJob: JobJSON) {
    this.selectedStage = eachStage;
    this.selectedJob   = eachJob;
  }

  private showSelection() {
    if (!this.selectedJob && !this.selectedStage) {
      this.selectStage(this.templateConfig().stages[0]);
    }
    if (this.selectedJob) {
      return this.showJob(this.selectedStage!, this.selectedJob!);
    }

    return this.showStage(this.selectedStage!);
  }

  private showStage(stage: StageJSON) {
    const stageProperties = new Map([
      ["阶段类型", stage.approval.type === "success" ? "成功自动运行" : "手工"],
      ["Fetch Materials", this.yesOrNo(stage.fetch_materials)],
      ["从不清理文档", this.yesOrNo(stage.never_cleanup_artifacts)],
      ["清理工作目录", this.yesOrNo(stage.clean_working_directory)],
    ]);
    return (
      <div data-test-id={`selected-stage-${stage.name}`} class={styles.stageOrJob}>
        显示阶段 <em>{stage.name}</em>
        <hr/>
        <div class={styles.propertiesWrapper}>
          <KeyValuePair data={stageProperties}/>
        </div>
        <Tabs
          tabs={["环境变量", "权限"]}
          contents={
            [this.environmentVariables(stage.environment_variables), this.stagePermissions(stage)]}/>
      </div>
    );
  }

  private showJob(stage: StageJSON, job: JobJSON) {
    const jobProperties = new Map<string, any>([
      ["资源", _.isEmpty(job.resources) ? null : job.resources.join(", ")],
      ["弹性节点配置ID", job.elastic_profile_id],
      ["作业超时", (this.jobTimeout(job))],
      ["运行类型", this.jobRunType(job)],
    ]);

    return (
      <div data-test-id={`selected-job-${stage.name}-${job.name}`} class={styles.stageOrJob}>
        Showing job <em>{stage.name}</em> &gt; <em>{job.name}</em>
        <hr/>
        <div className={styles.propertiesWrapper}>
          <KeyValuePair data={jobProperties}/>
        </div>
        <Tabs
          tabs={["任务", "文档", "环境变量", "自定义选项卡"]}
          contents={[this.tasks(job.tasks), this.artifacts(job.artifacts), this.environmentVariables(job.environment_variables), this.tabs(
            job.tabs)]}/>
      </div>
    );
  }

  private jobTimeout(job: JobJSON) {
    let timeout: any;
    if (_.isNil(job.timeout)) {
      timeout = "Use server default";
    } else if (job.timeout === 0) {
      timeout = "Never timeout";
    } else {
      timeout = `Cancel after ${job.timeout} ${inflection.pluralize("minute", job.timeout)} of inactivity`;
    }
    return timeout;
  }

  private jobRunType(job: JobJSON) {
    if (job.run_instance_count === "all") {
      return "Run on all agents";
    } else if (job.run_instance_count === 0) {
      return `Run on ${job.run_instance_count} agents`;
    } else {
      return `Run on 1 agent`;
    }
  }

  private yesOrNo(b: boolean) {
    return b ? "是" : "否";
  }

  private environmentVariables(variables: EnvironmentVariableJSON[]) {
    if (_.isEmpty(variables)) {
      return <FlashMessage message="未配置环境变量." type={MessageType.info}/>;
    }

    const data = new Map(variables.map((eachVar) => {
      return [eachVar.name, eachVar.secure ? "******" : eachVar.value];
    }));
    return <KeyValuePair data={data}/>;
  }

  private stagePermissions(stage: StageJSON) {
    const authorization = stage.approval.authorization;
    const data          = new Map<string, m.Children>();

    if (authorization) {
      if (authorization.users.length >= 1) {
        data.set("Users", authorization.users.join(", "));
      }
      if (authorization.roles.length >= 1) {
        data.set("Roles", authorization.roles.join(", "));
      }
    }

    if (data.size === 0) {
      return (
        <FlashMessage
          message="没有为此阶段及其算法组配置授权。只有管理员才能操作此阶段。"
          type={MessageType.info}/>
      );
    } else {
      return <KeyValuePair data={data}/>;
    }

  }

  private artifacts(artifacts: ArtifactJSON[]) {
    if (_.isEmpty(artifacts)) {
      return (<FlashMessage message="未配置任何文档" type={MessageType.info}/>);
    }

    const artifactsGroupedByType = _.groupBy(artifacts,
      (eachArtifact) => eachArtifact.type);

    return [
      this.buildArtifacts(artifactsGroupedByType.build),
      this.testArtifacts(artifactsGroupedByType.test),
      this.externalArtifacts(artifactsGroupedByType.external),
    ];
  }

  private tabs(tabs: TabJSON[]) {
    if (_.isEmpty(tabs)) {
      return (<FlashMessage message="未配置任何自定义选项卡" type={MessageType.info}/>);
    }
    const data = tabs.map((eachTab) => {
      return [eachTab.name, eachTab.path];
    });

    return <Table headers={["选项卡名称", "路径"]} data={data}/>;
  }

  private tasks(tasks: TaskJSON[]) {
    if (_.isEmpty(tasks)) {
      return (<FlashMessage message="未配置任何任务" type={MessageType.info}/>);
    }

    return (
      <div class={styles.taskList}>
        {tasks.map((eachTask, index) => {
          return (
            <div data-test-id={`task-${index}`} class={styles.taskRow}>
              <div class={styles.taskDescription}>
                <TaskWidget pluginInfos={this.pluginInfos} task={eachTask}/>
              </div>
              <div class={styles.taskRunIf}>
                Run if {eachTask.attributes.run_if.join(", ")}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  private buildArtifacts(artifacts: ArtifactJSON[]) {
    if (_.isEmpty(artifacts)) {
      return <FlashMessage message="未配置任何构建文档" type={MessageType.info}/>;
    }

    const data = artifacts.map((eachArtifact) => {
      return [eachArtifact.source, eachArtifact.destination];
    });

    return <Table caption="构建文档" headers={["源", "目录"]} data={data}/>;
  }

  private testArtifacts(artifacts: ArtifactJSON[]) {
    if (_.isEmpty(artifacts)) {
      return <FlashMessage message="未配置任务测试文档" type={MessageType.info}/>;
    }

    const data = artifacts.map((eachArtifact) => {
      return [eachArtifact.source, eachArtifact.destination];
    });

    return <Table caption="测试报告文档" headers={["源", "目标"]} data={data}/>;
  }

  private externalArtifacts(artifacts: ArtifactJSON[]) {
    if (_.isEmpty(artifacts)) {
      return <FlashMessage message="未配置任何外部文档" type={MessageType.info}/>;
    }

    return [
      <div>外部文档</div>,
      artifacts.map((eachArtifact) => {
        return this.externalArtifact(eachArtifact);
      })
    ];
  }

  private externalArtifact(artifact: ArtifactJSON) {
    const artifactInfo   = new Map([["Artifact ID", artifact.artifact_id], ["Store ID", artifact.store_id]]);
    const artifactConfig = new Map(artifact.configuration!.map((eachConfig) => {
      return [eachConfig.key, eachConfig.value || "******"];
    }));

    return (
      <div>
        <KeyValuePair data={artifactInfo}/>
        Configuration:
        <div style="padding-left: 15px;">
          <KeyValuePair data={artifactConfig}/>
        </div>
      </div>
    );
  }

}
