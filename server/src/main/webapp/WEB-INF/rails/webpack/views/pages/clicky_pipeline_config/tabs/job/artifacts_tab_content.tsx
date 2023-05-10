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

import classNames from "classnames/bind";
import m from "mithril";
import Stream from "mithril/stream";
import {ArtifactStores} from "models/artifact_stores/artifact_stores";
import {ArtifactStoresCRUD} from "models/artifact_stores/artifact_stores_crud";
import {Artifact, Artifacts, ArtifactType, ExternalArtifact, GoCDArtifact} from "models/pipeline_configs/artifact";
import {Job} from "models/pipeline_configs/job";
import {PipelineConfig} from "models/pipeline_configs/pipeline_config";
import {TemplateConfig} from "models/pipeline_configs/template_config";
import {ArtifactExtension} from "models/shared/plugin_infos_new/extensions";
import {ExtensionTypeString} from "models/shared/plugin_infos_new/extension_type";
import {PluginInfos} from "models/shared/plugin_infos_new/plugin_info";
import {PluginInfoCRUD} from "models/shared/plugin_infos_new/plugin_info_crud";
import {Secondary} from "views/components/buttons";
import {FlashMessage, MessageType} from "views/components/flash_message";
import {SelectField, SelectFieldOptions, TextField} from "views/components/forms/input_fields";
import * as Icons from "views/components/icons";
import * as Tooltip from "views/components/tooltip";
import {TooltipSize} from "views/components/tooltip";
import styles from "views/pages/clicky_pipeline_config/tabs/job/artifacts.scss";
import {TabContent} from "views/pages/clicky_pipeline_config/tabs/tab_content";
import {PipelineConfigRouteParams} from "views/pages/clicky_pipeline_config/tab_handler";
import * as foundationStyles from "views/pages/new_plugins/foundation_hax.scss";

const AngularPluginNew     = require("views/shared/angular_plugin_new").AngularPluginNew;
const foundationClassNames = classNames.bind(foundationStyles);

export class ArtifactsTabContent extends TabContent<Job> {
  public artifactStores: Stream<ArtifactStores> = Stream(new ArtifactStores());
  public pluginInfos: Stream<PluginInfos>       = Stream(new PluginInfos());
  private addArtifactType: Stream<ArtifactType> = Stream();

  constructor(fetchData?: () => void) {
    super();
    this.addArtifactType(ArtifactType.build);
    fetchData ? fetchData() : this.fetchData();
  }

  static tabName(): string {
    return "文档";
  }

  protected renderer(entity: Job, templateConfig: TemplateConfig): m.Children {
    const readonly = this.isEntityDefinedInConfigRepository();

    let artifacts = entity.artifacts().map((artifact, index) => {
      switch (artifact.type()) {
        case ArtifactType.build:
          return this.getBuiltInArtifactView(artifact as GoCDArtifact, this.removalFn(entity.artifacts(), index), readonly);
        case ArtifactType.test:
          return this.getBuiltInArtifactView(artifact as GoCDArtifact, this.removalFn(entity.artifacts(), index), readonly);
        case ArtifactType.external:
          return this.getExternalArtifactView(artifact as ExternalArtifact, this.removalFn(entity.artifacts(), index), readonly);
      }
    });

    if (entity.artifacts().length === 0) {
      artifacts = [<FlashMessage type={MessageType.info}
                                 message={"未配置文档，点击'新建文档'来配置文档."}/>];
    }

    return <div data-test-id="artifacts">
      {artifacts}
      {this.addArtifactView(entity.artifacts(), readonly)}
    </div>;
  }

  protected selectedEntity(pipelineConfig: PipelineConfig, routeParams: PipelineConfigRouteParams): Job {
    return pipelineConfig.stages().findByName(routeParams.stage_name!)!.jobs().findByName(routeParams.job_name!)!;
  }

  private getBuiltInArtifactHeaders() {
    return <div class={styles.builtInArtifactHeader} data-test-id="tabs-header">
      <span data-test-id="type-header">
        类型: <Tooltip.Info size={TooltipSize.small}
                            content={"文档有三种类型——构建、测试和外部。当选择test时，服务器将使用此文档生成测试报告。当选择工件类型external时，您可以配置外部文档存储，您可以将文档推送到该存储。"}/>
      </span>
      <span data-test-id="source-header">
        源文件: <Tooltip.Info size={TooltipSize.small}
                              content={"要发布到服务器的文件或文件夹。服务器将只上载作业的工作目录中的文件。您可以使用通配符指定要上载的文件和文件夹（**表示任何路径，*表示任何文件或文件夹名称）。"}/>
      </span>
      <span data-test-id="destination-header">
        目标目录: <Tooltip.Info size={TooltipSize.small}
                                   content={"目标是相对于服务器端当前实例的文档文件夹的。如果未指定，则文档将存储在文档目录的根目录中"}/>
      </span>
    </div>;
  }

  private getBuiltInArtifactView(artifact: GoCDArtifact, removeEntityFn: () => void, readonly: boolean) {
    let removeArtifact: m.Children;

    if (!readonly) {
      removeArtifact = <Icons.Close data-test-id={`remove-${artifact.type()}-artifact`}
                                    iconOnly={true}
                                    onclick={() => removeEntityFn()}/>;
    }

    return <div class={styles.artifactContainer} data-test-id={`${artifact.type()}-artifact-view`}>
      {this.getBuiltInArtifactHeaders()}
      <div class={styles.builtInArtifactContainer}>
        <div class={styles.artifactType} data-test-id="artifact-type">
          {this.capitalizeInitial(artifact.type())} Artifact
        </div>
        <TextField dataTestId={`artifact-source-${artifact.source() || ""}`}
                   readonly={readonly}
                   placeholder="源文件"
                   errorText={artifact.errors().errorsForDisplay('source')}
                   property={artifact.source}/>
        <TextField dataTestId={`artifact-destination-${artifact.destination() || ""}`}
                   readonly={readonly}
                   placeholder="目标目录"
                   errorText={artifact.errors().errorsForDisplay('destination')}
                   property={artifact.destination}/>
        {removeArtifact}
      </div>
    </div>;
  }

  private getExternalArtifactHeaders() {
    return <div class={styles.builtInArtifactHeader} data-test-id="tabs-header">
      <span data-test-id="type-header">
        类型: <Tooltip.Info size={TooltipSize.small}
                            content={"文档有三种类型——构建、测试和外部。当选择test时，服务器将使用此文档生成测试报告。当选择工件类型external时，您可以配置外部文档存储，您可以将文档推送到该存储。"}/>
      </span>
      <span class={styles.idHeader} data-test-id="id-header">
        Id: <Tooltip.Info size={TooltipSize.small}
                          content={"这个id用于标识被推送到外部存储的文档。id稍后在下游算法中使用，以从外部存储中获取文件。"}/>
      </span>
      <span data-test-id="store-id-header">
        文档存储 Id: <Tooltip.Info size={TooltipSize.small}
                                content={"这是对配置中定义的全局文档存储的引用。在将文档发布到外部存储时，插件会使用与此存储id相关联的全局属性。"}/>
      </span>
    </div>;
  }

  private getExternalArtifactView(artifact: ExternalArtifact, removeEntityFn: () => void, readonly: boolean) {
    let pluginConfigurations: m.Child;
    if (!!artifact.storeId()) {
      const found      = this.artifactStores().find(store => store.id() === artifact.storeId())!;
      const pluginInfo = this.pluginInfos().findByPluginId(found.pluginId())!;

      if (!pluginInfo) {
        const msg = `法创建/编辑外部项目，因为缺少与项目存储'${found.id()}'关联的外部项目插件'${found.pluginId()}'！`;
        pluginConfigurations = <FlashMessage type={MessageType.info} message={msg}/>;
      } else {
        const artifactExtension = pluginInfo.extensionOfType(ExtensionTypeString.ARTIFACT) as ArtifactExtension;
        pluginConfigurations    = (<div class={`${foundationClassNames(foundationStyles.foundationGridHax,
                                                                       foundationStyles.foundationFormHax)}
                                                                     ${styles.pluginView}`}>
          <AngularPluginNew pluginInfoSettings={Stream(artifactExtension.artifactConfigSettings)}
                            disabled={readonly}
                            configuration={artifact.configuration()}/>
        </div>);
      }
    }

    let removeArtifact: m.Children;

    if (!readonly) {
      removeArtifact = <Icons.Close data-test-id={`remove-${artifact.type()}-artifact`}
                                    iconOnly={true}
                                    onclick={() => removeEntityFn()}/>;
    }

    return <div class={styles.artifactContainer} data-test-id={`${artifact.type()}-artifact-view`}>
      {this.getExternalArtifactHeaders()}
      <div className={styles.builtInArtifactContainer}>
        <div className={styles.artifactType} data-test-id="artifact-type">
          {this.capitalizeInitial(artifact.type())} Artifact
        </div>
        <TextField dataTestId={`artifact-id-${artifact.artifactId() || ""}`}
                   placeholder="id"
                   errorText={artifact.errors().errorsForDisplay('id')}
                   readonly={readonly}
                   property={artifact.artifactId}/>
        <SelectField readonly={readonly}
                     errorText={artifact.errors().errorsForDisplay('storeId')}
                     dataTestId={"artifact-store-id"}
                     property={artifact.storeId}>
          <SelectFieldOptions selected={artifact.storeId()}
                              items={this.artifactStores().map(s => s.id())}/>
        </SelectField>
        {removeArtifact}
      </div>
      {pluginConfigurations}
    </div>;
  }

  private capitalizeInitial(word: string) {
    return word[0].toUpperCase() + word.slice(1);
  }

  private removalFn(collection: Artifacts, index: number) {
    return () => collection.splice(index, 1);
  }

  private addArtifactView(artifacts: Artifacts, readonly: boolean) {
    if (readonly) {
      return;
    }

    let noArtifactStoreError: m.Child;

    if (this.addArtifactType() === ArtifactType.external && this.artifactStores().length === 0) {
      const msg = <div data-test-id="no-artifact-store-configured-msg">
        未配置文档存储. 请到 <a href="/go/admin/artifact_stores" title="Artifact Stores">文档存储页面</a> 配置文档存储.
      </div>;
      noArtifactStoreError = <FlashMessage type={MessageType.warning} message={msg}/>;
    }

    return (<div data-test-id="add-artifact-wrapper">
      {noArtifactStoreError}
      <div class={styles.addArtifactWrapper}>
        <SelectField property={this.addArtifactType}>
          <SelectFieldOptions selected={this.addArtifactType()}
                              items={[ArtifactType.build, ArtifactType.test, ArtifactType.external].map(opt => { return {
                                id: opt,
                                text: this.capitalizeInitial(opt)
                              };})}/>
        </SelectField>
        <Secondary small={true} dataTestId={"add-artifact-button"}
                   disabled={!!noArtifactStoreError}
                   onclick={this.addArtifact.bind(this, artifacts)}>
          添加文档
        </Secondary>
      </div>
    </div>);
  }

  private addArtifact(artifacts: Artifacts) {
    artifacts.push(Artifact.fromJSON({type: this.addArtifactType()}));
  }

  private fetchData() {
    this.pageLoading();
    return Promise.all([
                         PluginInfoCRUD.all({type: ExtensionTypeString.ARTIFACT}),
                         ArtifactStoresCRUD.all()
                       ])
                  .then((results) => {
                    results[0].do((successResponse) => {
                      this.pluginInfos(successResponse.body);
                      this.pageLoaded();
                    }, this.pageLoadFailure);

                    results[1].do((successResponse) => {
                      this.artifactStores(successResponse.body);
                      this.pageLoaded();
                    }, this.pageLoadFailure);
                  });
  }
}
