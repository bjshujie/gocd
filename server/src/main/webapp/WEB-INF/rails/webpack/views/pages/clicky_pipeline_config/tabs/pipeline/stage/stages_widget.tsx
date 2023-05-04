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

import {ErrorResponse} from "helpers/api_request_builder";
import {MithrilComponent} from "jsx/mithril-component";
import m from "mithril";
import Stream from "mithril/stream";
import {DependentPipeline} from "models/internal_pipeline_structure/pipeline_structure";
import {NameableSet} from "models/pipeline_configs/nameable_set";
import {Stage} from "models/pipeline_configs/stage";
import s from "underscore.string";
import {Secondary} from "views/components/buttons";
import {FlashMessageModelWithTimeout, MessageType} from "views/components/flash_message";
import {Delete} from "views/components/icons";
import {Table} from "views/components/table";
import style from "views/pages/clicky_pipeline_config/index.scss";
import {PipelineConfigPage} from "views/pages/clicky_pipeline_config/pipeline_config";
import {EntityReOrderHandler} from "views/pages/clicky_pipeline_config/tabs/common/re_order_entity_widget";
import {AddStageModal} from "views/pages/clicky_pipeline_config/tabs/pipeline/stage/add_stage_modal";
import {ConfirmationDialog} from "views/pages/pipeline_activity/confirmation_modal";

export interface Attrs {
  stages: Stream<NameableSet<Stage>>;
  isUsingTemplate: boolean;
  isEditable: boolean;
  entityReOrderHandler: EntityReOrderHandler;
  flashMessage: FlashMessageModelWithTimeout;
  pipelineConfigSave: () => any;
  pipelineConfigReset: () => any;
  dependentPipelines: Stream<DependentPipeline[]>;
}

export interface State {
  getModal: () => AddStageModal;
}

export class StagesWidget extends MithrilComponent<Attrs, State> {
  oninit(vnode: m.Vnode<Attrs, State>) {
    vnode.state.getModal = () => new AddStageModal(vnode.attrs.stages(), vnode.attrs.pipelineConfigSave, vnode.attrs.flashMessage);
  }

  view(vnode: m.Vnode<Attrs, State>) {
    if (vnode.attrs.isUsingTemplate) {
      return;
    }

    const readonly            = vnode.attrs.entityReOrderHandler.hasOrderChanged();
    let disabledTitle: string = "";

    if (readonly) {
      disabledTitle = "Stages reorder is in progress. Complete stage reordering to add a new stage.";
    }

    let addStageBtn: m.Children;
    if (vnode.attrs.isEditable) {
      addStageBtn = <Secondary dataTestId={"add-stage-button"}
                               disabled={readonly} title={disabledTitle}
                               onclick={() => vnode.state.getModal().render()}>新增阶段</Secondary>;
    }

    return <div data-test-id={"stages-container"}>
      {vnode.attrs.entityReOrderHandler.getReOrderConfirmationView()}
      <Table headers={StagesWidget.getTableHeaders(vnode.attrs.isEditable)}
             data={this.getTableData(vnode)}
             draggable={vnode.attrs.isEditable}
             dragEnd={vnode.attrs.entityReOrderHandler.onReOder.bind(vnode.attrs.entityReOrderHandler)}
             dragHandler={StagesWidget.reArrange.bind(this, vnode.attrs.stages)}/>
      {addStageBtn}
    </div>;
  }

  private static getTableHeaders(isEditable: boolean) {
    const headers = ["阶段名称", "启动类型", "作业"];
    if (isEditable) {
      headers.push("删除");
    }
    return headers;
  }

  private static reArrange(stages: Stream<NameableSet<Stage>>, oldIndex: number, newIndex: number) {
    const array = Array.from(stages().values());
    array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
    stages(new NameableSet(array));
  }

  private getTableData(vnode: m.Vnode<Attrs, State>): m.Child[][] {
    const stages     = Array.from(vnode.attrs.stages().values());
    const isEditable = vnode.attrs.isEditable;

    return stages.map((stage: Stage, index: number) => {
      let deleteDisabledMessage: string | undefined;

      if (Array.from(stages.values()).length === 1) {
        deleteDisabledMessage = "无法从算法中删除唯一阶段.";
      }

      const stageDependentPipelines = vnode.attrs.dependentPipelines().reduce((dependent, ele) => {
        if (ele.depends_on_stage === stage.name()) {
          dependent.push(ele.dependent_pipeline_name);
        }
        return dependent;
      }, [] as string[]);

      if (stageDependentPipelines.length > 0) {
        deleteDisabledMessage = `无法删除阶段 '${stage.name()}' 因为算法 '${stageDependentPipelines}' 依赖于它.`;
      }

      const cells: m.Child[] = [
        <a href={`#!${PipelineConfigPage.pipelineName()}/${stage.name()}/stage_settings`}
           class={style.nameLink}>{stage.name()}</a>,
        stage.approval().typeAsString(),
        stage.jobs().length
      ];
      if (isEditable) {
        cells.push(<Delete iconOnly={true}
                           title={deleteDisabledMessage}
                           onclick={this.deleteStage.bind(this, vnode, stage, index)}
                           disabled={!!deleteDisabledMessage}
                           data-test-id={`${s.slugify(stage.name())}-delete-icon`}/>);
      }
      return cells;
    });
  }

  private deleteStage(vnode: m.Vnode<Attrs, State>, stageToDelete: Stage, index: number) {
    new ConfirmationDialog(
      "删除阶段",
      <div>您要删除阶段 '<em>{stageToDelete.name()}</em>'吗?</div>,
      this.onDelete.bind(this, vnode, stageToDelete, index)
    ).render();
  }

  private onDelete(vnode: m.Vnode<Attrs, State>, stageToDelete: Stage, index: number) {
    vnode.attrs.stages().delete(stageToDelete);
    return vnode.attrs.pipelineConfigSave().then(() => {
      vnode.attrs.flashMessage.setMessage(MessageType.success, `阶段 '${stageToDelete.name()}' 删除成功.`);
    }).catch((_errorResponse: ErrorResponse) => {
      const newStages = Array.from(vnode.attrs.stages().values()).splice(0, index);
      newStages.push(stageToDelete);
      newStages.push(...Array.from(vnode.attrs.stages().values()).splice(index));
      vnode.attrs.stages(new NameableSet(newStages));
    }).finally(m.redraw.sync);
  }
}
