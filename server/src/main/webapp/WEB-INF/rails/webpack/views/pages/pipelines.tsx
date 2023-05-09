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

// utils
import {docsUrl} from "gen/gocd_version";
import {queryParamAsString} from "helpers/url";
import _ from "lodash";
import m from "mithril";
import Stream from "mithril/stream";
import {Scms} from "models/materials/pluggable_scm";
import {PluggableScmCRUD} from "models/materials/pluggable_scm_crud";
import {PackagesCRUD} from "models/package_repositories/packages_crud";
import {PackageRepositories, Packages} from "models/package_repositories/package_repositories";
import {PackageRepositoriesCRUD} from "models/package_repositories/package_repositories_crud";
import {ExtensionTypeString} from "models/shared/plugin_infos_new/extension_type";
import {PluginInfos} from "models/shared/plugin_infos_new/plugin_info";
import {PluginInfoCRUD} from "models/shared/plugin_infos_new/plugin_info_crud";
// components
import {ConceptDiagram} from "views/components/concept_diagram";
import {EnvironmentVariablesWidget} from "views/components/environment_variables";
import {Link} from "views/components/link";
import {Page, PageState} from "views/pages/page";
import {PipelineActions} from "views/pages/pipelines/actions";
import {AdvancedSettings} from "views/pages/pipelines/advanced_settings";
import {FillableSection} from "views/pages/pipelines/fillable_section";
import {JobEditor} from "views/pages/pipelines/job_editor";
import {MaterialEditor} from "views/pages/pipelines/material_editor";
// models
import {PipelineConfigVM} from "views/pages/pipelines/pipeline_config_view_model";
import {PipelineInfoEditor} from "views/pages/pipelines/pipeline_info_editor";
import {StageEditor} from "views/pages/pipelines/stage_editor";
import {TaskTerminalField} from "views/pages/pipelines/task_editor";
import {UserInputPane} from "views/pages/pipelines/user_input_pane";
import {PackageRepositoriesPage} from "./package_repositories";

const materialImg = require("../../../app/assets/images/concept_diagrams/concept_material.svg");
const pipelineImg = require("../../../app/assets/images/concept_diagrams/concept_pipeline.svg");
const stageImg    = require("../../../app/assets/images/concept_diagrams/concept_stage.svg");
const jobImg      = require("../../../app/assets/images/concept_diagrams/concept_job.svg");

interface State {
  pluginInfos: Stream<PluginInfos>;
  packageRepositories: Stream<PackageRepositories>;
  packages: Stream<Packages>;
  scmMaterials: Stream<Scms>;
}

export class PipelineCreatePage extends Page<{}, State> {
  private model = new PipelineConfigVM();

  pageName(): string {
    return "创建新算法";
  }

  oninit(vnode: m.Vnode<{}, State>) {
    super.oninit(vnode);
    const group = queryParamAsString(window.location.search, "group").trim();

    if ("" !== group) {
      this.model.pipeline.group(group);
    }

    vnode.state.pluginInfos         = Stream(new PluginInfos());
    vnode.state.packageRepositories = Stream();
    vnode.state.packages            = Stream();
    vnode.state.scmMaterials        = Stream();
  }

  componentToDisplay(vnode: m.Vnode<{}, State>): m.Children {
    const {pipeline, material, stage, job, isUsingTemplate} = this.model;
    const mergedPkgRepos                                    = PackageRepositoriesPage.getMergedList(vnode.state.packageRepositories, vnode.state.packages);
    return [
      <FillableSection>
        <UserInputPane heading="部分 1: 启动器">
          <MaterialEditor material={material} showExtraMaterials={true} pluggableScms={vnode.state.scmMaterials()} pipelineGroupName={this.model.pipeline.group()}
                          readonly={false} packageRepositories={mergedPkgRepos} pluginInfos={vnode.state.pluginInfos()}/>
        </UserInputPane>
        <ConceptDiagram image={materialImg}>
          一个算法定义总是从 <strong>算法启动器</strong>开始
        </ConceptDiagram>
      </FillableSection>,

      <FillableSection>
        <UserInputPane heading="部分 2: 算法详情">
          <PipelineInfoEditor pipelineConfig={pipeline} isUsingTemplate={isUsingTemplate}/>
        </UserInputPane>
        <ConceptDiagram image={pipelineImg}>
          <strong>算法</strong> 代表一个 <strong>工作流程</strong>. 算法包含一个或多个 <strong>阶段</strong>.
        </ConceptDiagram>
      </FillableSection>,

      this.model.whenTemplateAbsent(() => [
        <FillableSection>
          <UserInputPane heading="部分 3: 阶段详情">
            <StageEditor stage={stage}/>
          </UserInputPane>
          <ConceptDiagram image={stageImg}>
            一个<strong>阶段</strong> 是作业的集合, 一个 <strong>作业</strong> 是要执行的算法的一片断.
          </ConceptDiagram>
        </FillableSection>,

        <FillableSection>
          <UserInputPane heading="部分 4: 作业和任务">
            <JobEditor job={job}/>
            <TaskTerminalField label="在下面的提示符中输入您的任务" property={job.tasks} errorText={job.errors().errorsForDisplay("tasks")}
                               required={true}/>
            <AdvancedSettings forceOpen={_.some(job.environmentVariables(), (env) => env.errors().hasErrors())}>
              <EnvironmentVariablesWidget environmentVariables={job.environmentVariables()}/>
            </AdvancedSettings>
          </UserInputPane>
          <ConceptDiagram image={jobImg}>
            一个<strong>作业</strong> 例如是一段脚本，它会按顺序调用每一步的 <strong>任务</strong>. 典型的一个任务就是一条命令.
          </ConceptDiagram>
        </FillableSection>
      ]),

      <PipelineActions pipelineConfig={pipeline}/>
    ];
  }

  fetchData(vnode: m.Vnode<{}, State>): Promise<any> {
    return Promise.all([PluginInfoCRUD.all({type: ExtensionTypeString.PACKAGE_REPO}), PluginInfoCRUD.all({type: ExtensionTypeString.SCM}),
                         PackageRepositoriesCRUD.all(), PackagesCRUD.all(), PluggableScmCRUD.all()])
                  .then((result) => {
                    [result[0], result[1]]
                      .forEach((apiResult) => apiResult.do((successResponse) => {
                        vnode.state.pluginInfos().push(...successResponse.body);
                        this.pageState = PageState.OK;
                      }, this.setErrorState));

                    result[2].do((successResponse) => {
                      vnode.state.packageRepositories(successResponse.body);
                      this.pageState = PageState.OK;
                    }, this.setErrorState);

                    result[3].do((successResponse) => {
                      vnode.state.packages(successResponse.body);
                      this.pageState = PageState.OK;
                    }, this.setErrorState);

                    result[4].do((successResponse) => {
                      vnode.state.scmMaterials(successResponse.body);
                      this.pageState = PageState.OK;
                    }, this.setErrorState);
                  });
  }

  helpText(): m.Children {
    return <div>
      关于算法基本设置, 请查看
      <Link href={docsUrl('configuration/quick_pipeline_setup.html')} externalLinkIcon={true}> 这里.</Link>
    </div>;
  }
}
