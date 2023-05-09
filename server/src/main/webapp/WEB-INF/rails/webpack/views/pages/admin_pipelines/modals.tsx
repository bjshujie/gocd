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

import {ApiRequestBuilder, ApiVersion, ErrorResponse, SuccessResponse} from "helpers/api_request_builder";
import {SparkRoutes} from "helpers/spark_routes";
import _ from "lodash";
import m from "mithril";
import Stream from "mithril/stream";
import {Pipeline, PipelineGroup, PipelineGroups, PipelineWithOrigin} from "models/internal_pipeline_structure/pipeline_structure";
import {PipelineConfig} from "models/pipeline_configs/pipeline_config";
import {ModelWithNameIdentifierValidator} from "models/shared/name_validation";
import {PluginInfos} from "models/shared/plugin_infos_new/plugin_info";
import * as Buttons from "views/components/buttons";
import {FlashMessage, MessageType} from "views/components/flash_message";
import {Form, FormBody} from "views/components/forms/form";
import {SelectField, SelectFieldOptions, TextField} from "views/components/forms/input_fields";
import {Link} from "views/components/link";
import {Modal, ModalState, Size} from "views/components/modal";
import {OperationState} from "../page_operations";

abstract class BasePipelineModal extends Modal {
  protected originalPipeline: Stream<PipelineConfig>;
  protected etag: Stream<string>                  = Stream("");
  protected readonly errorMessage: Stream<string> = Stream();
  protected readonly isStale                      = Stream(true);
  protected ajaxOperationMonitor                  = Stream<OperationState>(OperationState.UNKNOWN);

  constructor(originalPipeline: PipelineConfig) {
    super();
    this.originalPipeline = Stream(originalPipeline);
  }

  render(): void {
    super.render();

    if (this.isStale()) {
      this.modalState = ModalState.LOADING;
      PipelineConfig.get(this.originalPipeline().name())
                    .then((result) => {
                      this.modalState = ModalState.OK;
                      result.do(
                        (successResponse) => {
                          this.etag(result.getEtag()!);
                          const json = JSON.parse(successResponse.body);
                          this.originalPipeline(PipelineConfig.fromJSON(json));
                          this.isStale(false);
                        },
                        (errorResponse) => {
                          const parsed = JSON.parse(errorResponse.body!);
                          this.errorMessage(parsed.message);
                        });
                    });
    }
  }

  body(): m.Children {
    const flashMessage = this.errorMessage()
      ? <FlashMessage type={MessageType.alert} message={this.errorMessage()}/>
      : null;
    return [
      flashMessage,
      this.modalBody()
    ];
  }

  protected abstract modalBody(): m.Children;
}

export class MoveConfirmModal extends BasePipelineModal {
  private pipelineGroups: PipelineGroups;
  private readonly sourceGroup: PipelineGroup;
  private readonly successCallback: (msg: m.Children) => void;
  private readonly selection: Stream<string>;
  private apiService: ApiService;

  constructor(allPipelineGroups: PipelineGroups,
              sourceGroup: PipelineGroup,
              pipeline: PipelineWithOrigin,
              successCallback: (msg: m.Children) => void,
              apiService?: ApiService) {
    super(new PipelineConfig(pipeline.name()));
    this.pipelineGroups  = allPipelineGroups;
    this.sourceGroup     = sourceGroup;
    this.successCallback = successCallback;
    this.apiService      = apiService ? apiService : new MovePipelineService();
    this.selection       = Stream<string>();
  }

  title() {
    return `移动算法 ${this.originalPipeline().name()}`;
  }

  buttons() {
    return [
      <Buttons.Primary data-test-id="button-move"
                       disabled={this.isLoading() || _.isEmpty(this.selection())}
                       ajaxOperationMonitor={this.ajaxOperationMonitor}
                       ajaxOperation={this.performOperation.bind(this)}>移动</Buttons.Primary>,

      <Buttons.Cancel data-test-id="button-cancel" onclick={() => this.close()}
                      ajaxOperationMonitor={this.ajaxOperationMonitor}>取消</Buttons.Cancel>
    ];
  }

  protected modalBody(): m.Children {
    const items = _(this.pipelineGroups)
      .filter((eachGroup) => eachGroup.name() !== this.sourceGroup.name())
      .sortBy((eachGroup) => eachGroup.name().toLowerCase())
      .map((eachGroup) => ({id: eachGroup.name(), text: eachGroup.name()}))
      .value();

    return (
      <div>
        <SelectField dataTestId="move-pipeline-group-selection"
                     property={this.selection}
                     label={<span>选择算法 <em>{this.originalPipeline().name()}</em> 要被移动的目标算法组:</span>}>
          <SelectFieldOptions items={items} selected={this.selection()}/>
        </SelectField>
      </div>
    );
  }

  protected performOperation(): Promise<any> {
    const pipelineToSave = _.cloneDeep(this.originalPipeline());
    pipelineToSave.group(this.selection());
    const data = {
      name:             this.originalPipeline().name(),
      pipeline_to_save: pipelineToSave.toPutApiPayload(),
      etag:             this.etag()
    };
    return this.apiService.performOperation(
      () => {
        const msg = <span>
                  算法 <em>{this.originalPipeline().name()}</em> 从 <em>{this.sourceGroup.name()}</em> 移动到 <em>{this.selection()}</em>
                </span>;
        this.successCallback(msg);
        this.close();
      },
      (errorResponse) => {
        this.errorMessage(errorResponse.message);
        if (errorResponse.body) {
          this.errorMessage(JSON.parse(errorResponse.body).message);
        }
      },
      data);
  }
}

export class CreatePipelineGroupModal extends Modal {
  private readonly group: ModelWithNameIdentifierValidator;
  private readonly callback: (groupName: string) => void;

  constructor(callback: (groupName: string) => void) {
    super();
    this.group    = new ModelWithNameIdentifierValidator();
    this.callback = callback;
  }

  body() {
    return <TextField property={this.group.name}
                      errorText={this.group.errors().errorsForDisplay("name")}
                      onchange={() => this.group.validate("name")}
                      required={true}
                      label={"算法组名称"}/>;
  }

  title() {
    return "创建算法组";
  }

  buttons() {
    return [<Buttons.Primary
      data-test-id="button-create"
      disabled={_.isEmpty(this.group.name()) || this.group.errors().hasErrors()}
      onclick={this.create.bind(this)}>创建</Buttons.Primary>];
  }

  private create() {
    this.callback(this.group.name());
    this.close();
  }
}

export class ClonePipelineConfigModal extends BasePipelineModal {
  private readonly newPipelineName: ModelWithNameIdentifierValidator;
  private readonly newPipelineGroupName: ModelWithNameIdentifierValidator;
  private readonly successCallback: (newPipelineName: string) => void;
  private apiService: ApiService;

  constructor(sourcePipeline: Pipeline,
              successCallback: (newPipelineName: string) => void,
              apiService?: ApiService) {
    super(new PipelineConfig(sourcePipeline.name()));
    this.successCallback      = successCallback;
    this.apiService           = apiService ? apiService : new ClonePipelineGroupService();
    this.newPipelineName      = new ModelWithNameIdentifierValidator();
    this.newPipelineGroupName = new ModelWithNameIdentifierValidator();
  }

  title(): string {
    return `克隆算法 - ${this.originalPipeline().name()}`;
  }

  buttons(): m.ChildArray {
    const disabled = this.isLoading() ||
                     (_.isEmpty(this.newPipelineName.name()) || this.newPipelineName.errors().hasErrors())
                     || (_.isEmpty(this.newPipelineGroupName.name()) || this.newPipelineGroupName.errors().hasErrors());
    return [
      <Buttons.Primary
        data-test-id="button-clone"
        disabled={disabled}
        ajaxOperationMonitor={this.ajaxOperationMonitor}
        ajaxOperation={this.save.bind(this)}>克隆</Buttons.Primary>,
      <Buttons.Cancel data-test-id="button-cancel" onclick={() => this.close()}
                      ajaxOperationMonitor={this.ajaxOperationMonitor}>取消</Buttons.Cancel>
    ];
  }

  protected modalBody(): m.Children {
    return <FormBody>
      <Form last={true} compactForm={true}>
        <TextField
          property={this.newPipelineName.name}
          errorText={this.newPipelineName.errors().errorsForDisplay("name")}
          onchange={() => this.newPipelineName.validate("name")}
          required={true}
          label="新算法名称"/>
        <TextField
          property={this.newPipelineGroupName.name}
          errorText={this.newPipelineGroupName.errors().errorsForDisplay("name")}
          onchange={() => this.newPipelineGroupName.validate("name")}
          required={true}
          label="算法组名称"
          helpText={"如果不存在，新算法组将被创建."}/>
      </Form>
    </FormBody>;
  }

  private save() {
    // deep copy the pipeline, and change the name/group name
    const pipelineToSave = _.cloneDeep(this.originalPipeline());
    pipelineToSave.name(this.newPipelineName.name());
    pipelineToSave.group(this.newPipelineGroupName.name());

    const data = pipelineToSave.toApiPayload();

    return this.apiService.performOperation(
      () => {
        this.successCallback(this.newPipelineName.name());
        this.close();
      },
      (errorResponse) => {
        this.errorMessage(errorResponse.message);
        if (errorResponse.body) {
          this.errorMessage(JSON.parse(errorResponse.body).message);
        }
      },
      data);
  }
}

export class DownloadPipelineModal extends Modal {
  private readonly pipeline: PipelineWithOrigin;
  private readonly pluginInfos: PluginInfos;
  private readonly callback: (pluginId: string) => void;

  constructor(pipeline: PipelineWithOrigin, pluginInfos: PluginInfos, callback: (pluginId: string) => void) {
    super();
    this.pipeline    = pipeline;
    this.callback    = callback;
    this.pluginInfos = pluginInfos.configRepoPluginsWhich("supportsPipelineExport");
  }

  body() {
    return (
      <div>
        请选择算法 <em>{this.pipeline.name()}</em>下载的格式:
        <ul>
          {this.pluginInfos.map((eachPluginInfo) => {
            return (
              <li>
                <Link href="javascript:void(0)"
                      onclick={(e: MouseEvent) => {
                        this.callback(eachPluginInfo.id);
                      }}>{eachPluginInfo.about.name}</Link>
              </li>);
          })}
        </ul>
      </div>
    );
  }

  title() {
    return `下载算法 ${this.pipeline.name()}`;
  }

  buttons(): m.ChildArray {
    return [<Buttons.Primary data-test-id="button-close" onclick={this.close.bind(this)}>关闭</Buttons.Primary>];
  }
}

export class ExtractTemplateModal extends Modal {
  private readonly sourcePipelineName: string;
  private readonly callback: (templateName: string) => void;
  private readonly templateName: ModelWithNameIdentifierValidator;

  constructor(sourcePipelineName: string, callback: (templateName: string) => void) {
    super();
    this.sourcePipelineName = sourcePipelineName;
    this.callback           = callback;
    this.templateName       = new ModelWithNameIdentifierValidator();
  }

  body() {
    return (
      <div>
        <TextField
          property={this.templateName.name}
          errorText={this.templateName.errors().errorsForDisplay("name")}
          onchange={() => this.templateName.validate("name")}
          required={true}
          label={"新模板名称"}/>
        <div>
          算法 <em>{this.sourcePipelineName}</em> 将开始使用这个新模板.
        </div>
      </div>
    );
  }

  buttons() {
    return [<Buttons.Primary data-test-id="button-extract-template"
                             disabled={_.isEmpty(this.templateName.name()) || this.templateName.errors()
                                                                                  .hasErrors("name")}
                             onclick={this.extractTemplate.bind(this)}>抽取模板</Buttons.Primary>];
  }

  title(): string {
    return `从算法 ${this.sourcePipelineName} 中抽取模板`;
  }

  private extractTemplate() {
    this.callback(this.templateName.name());
    this.close();
  }

}

export class DeletePipelineGroupModal extends Modal {
  private pipelineGrpName: string;
  private successCallback: (msg: m.Children) => void;
  private readonly message: m.Children;
  private operationState: Stream<OperationState> = Stream<OperationState>(OperationState.UNKNOWN);
  private errorMessage?: string;
  private apiService: ApiService;

  constructor(pipelineGrpName: string, successCallback: (msg: m.Children) => void, apiService?: ApiService) {
    super(Size.small);
    this.pipelineGrpName = pipelineGrpName;
    this.successCallback = successCallback;
    this.apiService      = apiService ? apiService : new DeletePipelineGroupService(pipelineGrpName);
    this.message         = <span>您确定要删除算法组 <em>{pipelineGrpName}</em>吗?</span>;
  }

  body(): m.Children {
    if (this.errorMessage !== undefined) {
      return <FlashMessage type={MessageType.alert} message={this.errorMessage}/>;
    }
    return <div>{this.message}</div>;
  }

  title(): string {
    return "您确定吗?";
  }

  buttons(): m.ChildArray {
    if (this.errorMessage !== undefined) {
      return [
        <Buttons.Primary ajaxOperationMonitor={this.operationState} data-test-id='button-no-delete'
                         onclick={this.close.bind(this)}>确定</Buttons.Primary>
      ];
    }
    return [
      <Buttons.Danger data-test-id='button-delete'
                      ajaxOperationMonitor={this.operationState}
                      ajaxOperation={this.delete.bind(this)}>是 删除</Buttons.Danger>,
      <Buttons.Cancel ajaxOperationMonitor={this.operationState}
                      data-test-id='button-no-delete' onclick={this.close.bind(this)}
      >否</Buttons.Cancel>
    ];
  }

  private delete() {
    return this.apiService.performOperation(
      () => {
        this.successCallback(
          <span>算法组 <em>{this.pipelineGrpName}</em>被成功删除!</span>
        );
        this.close();
      },
      (errorResponse: ErrorResponse) => {
        if (errorResponse.body) {
          this.errorMessage = JSON.parse(errorResponse.body).message;
        }
      }
    );
  }
}

export interface ApiService {
  performOperation(onSuccess: (data: SuccessResponse<string>) => void,
                   onError: (message: ErrorResponse) => void,
                   data?: { [key: string]: any }): Promise<void>;
}

class DeletePipelineGroupService implements ApiService {
  private pipelineGrpName: string;

  constructor(pipelineGrpName: string) {
    this.pipelineGrpName = pipelineGrpName;
  }

  performOperation(onSuccess: (data: SuccessResponse<string>) => void,
                   onError: (message: ErrorResponse) => void): Promise<void> {
    return ApiRequestBuilder.DELETE(SparkRoutes.pipelineGroupsPath(this.pipelineGrpName), ApiVersion.latest)
                            .then((result) => result.do(onSuccess, onError));

  }
}

class ClonePipelineGroupService implements ApiService {
  performOperation(onSuccess: (data: SuccessResponse<string>) => void, onError: (message: ErrorResponse) => void, data?: { [key: string]: any }): Promise<void> {
    return ApiRequestBuilder.POST(SparkRoutes.adminPipelineConfigPath(),
                                  ApiVersion.latest,
                                  {
                                    payload: data,
                                    headers: {
                                      "X-pause-pipeline": "true",
                                      "X-pause-cause":    "Under construction"
                                    }
                                  })
                            .then((result) => result.do(onSuccess, onError));
  }

}

class MovePipelineService implements ApiService {
  performOperation(onSuccess: (data: SuccessResponse<string>) => void, onError: (message: ErrorResponse) => void, data?: { [p: string]: any }): Promise<void> {
    return ApiRequestBuilder
      .PUT(SparkRoutes.adminPipelineConfigPath(data!.name),
           ApiVersion.latest,
           {
             payload: data!.pipeline_to_save,
             etag:    data!.etag
           })
      .then((apiResult) => apiResult.do(onSuccess, onError));
  }
}
