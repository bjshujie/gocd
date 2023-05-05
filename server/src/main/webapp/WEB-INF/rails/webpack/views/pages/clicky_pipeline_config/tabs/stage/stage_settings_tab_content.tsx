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

import {MithrilViewComponent} from "jsx/mithril-component";
import m from "mithril";
import {PipelineConfig} from "models/pipeline_configs/pipeline_config";
import {Stage} from "models/pipeline_configs/stage";
import {TemplateConfig} from "models/pipeline_configs/template_config";
import {TextField} from "views/components/forms/input_fields";
import {SwitchBtn} from "views/components/switch";
import {TabContent} from "views/pages/clicky_pipeline_config/tabs/tab_content";
import {PipelineConfigRouteParams} from "views/pages/clicky_pipeline_config/tab_handler";
import styles from "./stage_settings.scss";

export class StageSettingsTabContent extends TabContent<Stage> {
  static tabName(): string {
    return "Stage Settings";
  }

  protected renderer(stage: Stage, templateConfig: TemplateConfig) {
    return <StageSettingsWidget stage={stage}
                                readonly={this.isEntityDefinedInConfigRepository()}/>;
  }

  protected selectedEntity(pipelineConfig: PipelineConfig, routeParams: PipelineConfigRouteParams): Stage {
    return Array.from(pipelineConfig.stages()).find(s => s.getOriginalName() === routeParams.stage_name!)!;
  }
}

interface Attrs {
  stage: Stage;
  readonly: boolean;
  //to reuse this view while creating a new stage. Based on this field, the view will not render less-important fields in create new stage view.
  isForAddStagePopup?: boolean;
}

export class StageSettingsWidget extends MithrilViewComponent<Attrs> {
  static readonly APPROVAL_TYPE_HELP = "如果启用，则一旦前一阶段成功完成，此阶段将自动启动。否则，用户必须手动 启动此阶段。对于算法中的第一阶段，启用此选项与在算法配置中的“自动算法调度”相同.";

  static readonly ALLOW_ONLY_ON_SUCCESS_HELP = "只有在上一阶段运行成功的情况下，才允许启动该阶段.";

  view(vnode: m.Vnode<Attrs>) {
    const stage = vnode.attrs.stage;

    let additionalStageSettings: m.Children;
    if (!vnode.attrs.isForAddStagePopup) {
      additionalStageSettings = <div data-test-id="additional-stage-settings">
        <div className={styles.switchWrapper}>
          <SwitchBtn label="获取 materials"
                     helpText="Perform material updates or checkouts."
                     dataTestId="fetch-materials-checkbox"
                     disabled={vnode.attrs.readonly}
                     small={true}
                     field={stage.fetchMaterials}/>
        </div>
        <div className={styles.switchWrapper}>
          <SwitchBtn label="从不清理文档"
                     helpText="如果在服务器级别配置了清除工件，则永远不要清除此阶段的文档."
                     dataTestId="never-cleanup-artifacts-checkbox"
                     small={true}
                     disabled={vnode.attrs.readonly}
                     field={stage.neverCleanupArtifacts}/>
        </div>
        <div className={styles.switchWrapper}>
          <SwitchBtn label="清理工作目录"
                     helpText="删除节点工作目录中的所有文件/目录."
                     dataTestId="clean-working-directory-checkbox"
                     small={true}
                     disabled={vnode.attrs.readonly}
                     field={stage.cleanWorkingDirectory}/>
        </div>
      </div>;
    }

    return <div data-test-id="stage-settings">
      <TextField label="阶段名称"
                 required={true}
                 readonly={vnode.attrs.readonly}
                 dataTestId="stage-name-input"
                 errorText={stage.errors().errorsForDisplay("name")}
                 property={stage.name}/>
      <div class={styles.switchWrapper}>
        <SwitchBtn label="前一个阶段完成后启动"
                   helpText={StageSettingsWidget.APPROVAL_TYPE_HELP}
                   field={stage.approval().typeAsStream()}
                   disabled={vnode.attrs.readonly}
                   small={true}
                   dataTestId="approval-checkbox"
                   onclick={StageSettingsWidget.approvalChange.bind(this, stage)}/>
      </div>
      <div class={styles.switchWrapper}>
        <SwitchBtn label="仅当前一个阶段成功后启动"
                   helpText={StageSettingsWidget.ALLOW_ONLY_ON_SUCCESS_HELP}
                   small={true}
                   disabled={vnode.attrs.readonly}
                   dataTestId="allow-only-on-success-checkbox"
                   field={stage.approval().allowOnlyOnSuccess}/>
      </div>
      {additionalStageSettings}
    </div>;
  }

  private static approvalChange(stage: Stage, e: MouseEvent) {
    const checkbox = e.currentTarget as HTMLInputElement;
    stage.approval().typeAsStream()(checkbox.checked);
  }
}
