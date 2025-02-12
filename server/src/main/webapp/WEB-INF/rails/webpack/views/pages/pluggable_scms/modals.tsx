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
import _ from "lodash";
import m from "mithril";
import Stream from "mithril/stream";
import {Scm, ScmJSON} from "models/materials/pluggable_scm";
import {PluggableScmCRUD} from "models/materials/pluggable_scm_crud";
import {PluginInfo, PluginInfos} from "models/shared/plugin_infos_new/plugin_info";
import * as Buttons from "views/components/buttons";
import {ButtonGroup} from "views/components/buttons";
import {FlashMessageModel, MessageType} from "views/components/flash_message";
import {Warning} from "views/components/icons";
import {Size} from "views/components/modal";
import {DeleteConfirmModal} from "views/components/modal/delete_confirm_modal";
import {EntityModal} from "views/components/modal/entity_modal";
import styles from "./index.scss";
import {PluggableScmModalBody} from "./pluggable_scm_modal_body";

abstract class PluggableScmModal extends EntityModal<Scm> {
  protected message: FlashMessageModel         = new FlashMessageModel();
  protected readonly originalEntityId: string;
  protected readonly originalEntityName: string;
  private readonly disableId: boolean;

  private readonly disablePluginId: boolean;

  constructor(entity: Scm,
              pluginInfos: PluginInfos,
              onSuccessfulSave: (msg: m.Children) => any,
              disableId: boolean       = false,
              disablePluginId: boolean = true,
              size: Size               = Size.large) {
    super(entity, pluginInfos, onSuccessfulSave, size);
    this.disableId          = disableId;
    this.disablePluginId    = disablePluginId;
    this.originalEntityId   = entity.id();
    this.originalEntityName = entity.name();
  }

  operationError(errorResponse: any, statusCode: number) {
    if (errorResponse.body) {
      this.errorMessage(JSON.parse(errorResponse.body).message);
    } else if (errorResponse.data) {
      this.entity(Scm.fromJSON(errorResponse.data));
    }
    this.errorMessage(errorResponse.message);
  }

  buttons(): any[] {
    return [
      <ButtonGroup>
        <Buttons.Primary data-test-id="button-save"
                         disabled={this.isLoading()}
                         ajaxOperationMonitor={this.ajaxOperationMonitor}
                         ajaxOperation={this.performOperation.bind(this)}>保存</Buttons.Primary>
        {this.saveFailureIdentifier}
      </ButtonGroup>,

      <div className={styles.alignLeft}>
        <Buttons.Cancel data-test-id="button-cancel" onclick={(e: MouseEvent) => this.close()}
                        ajaxOperationMonitor={this.ajaxOperationMonitor}>取消</Buttons.Cancel>
      </div>
    ];
  }

  protected modalBody(): m.Children {
    return <PluggableScmModalBody pluginInfos={this.pluginInfos} scm={this.entity()}
                                  disableId={this.disableId} disablePluginId={this.disablePluginId}
                                  pluginIdProxy={this.pluginIdProxy.bind(this)} message={this.message}/>;
  }

  protected onPluginChange(entity: Stream<Scm>, pluginInfo: PluginInfo): void {
    const pluginMetadata = entity().pluginMetadata();
    pluginMetadata.id(pluginInfo.id);
    entity(new Scm(entity().id(), entity().name(), entity().autoUpdate(), entity().origin(), pluginMetadata, entity().configuration()));
  }

  protected parseJsonToEntity(json: object): Scm {
    return Scm.fromJSON(json as ScmJSON);
  }

  protected performFetch(entity: Scm): Promise<any> {
    return PluggableScmCRUD.get(this.originalEntityName);
  }

  protected pluginIdProxy(newPluginId?: string): any {
    if (!newPluginId) {
      return this.entity().pluginMetadata().id();
    }

    if (newPluginId !== this.entity().pluginMetadata().id()) {
      const pluginInfo = _.find(this.pluginInfos, (pluginInfo: PluginInfo) => pluginInfo.id === newPluginId) as PluginInfo;
      this.onPluginChange(this.entity, pluginInfo);
    }

    return newPluginId;
  }
}

export class CreatePluggableScmModal extends PluggableScmModal {

  constructor(entity: Scm,
              pluginInfos: PluginInfos,
              onSuccessfulSave: (msg: m.Children) => any) {
    super(entity, pluginInfos, onSuccessfulSave, false, false);
    this.isStale(false);
  }

  title(): string {
    return "创建算法启动器";
  }

  protected operationPromise(): Promise<any> {
    return PluggableScmCRUD.create(this.entity());
  }

  protected successMessage(): m.Children {
    return <span>算法启动器 <em>{this.entity().name()}</em> 创建成功!</span>;
  }
}

export class EditPluggableScmModal extends PluggableScmModal {
  private readonly warningMsg = <span>
    <Warning iconOnly={true}/>这是一个全局副本。使用此算法启动器的所有算法都将受到影响.
  </span>;

  constructor(entity: Scm, pluginInfos: PluginInfos, onSuccessfulSave: (msg: m.Children) => any) {
    super(entity, pluginInfos, onSuccessfulSave, true);
    this.message = new FlashMessageModel(MessageType.warning, this.warningMsg);
  }

  title(): string {
    return `编辑算法启动插件 ${this.entity().name()}`;
  }

  operationPromise(): Promise<any> {
    return PluggableScmCRUD.update(this.entity(), this.etag());
  }

  successMessage(): m.Children {
    return <span>算法启动器 <em>{this.entity().name()}</em> 更新成功!</span>;
  }
}

export class ClonePluggableScmModal extends PluggableScmModal {
  constructor(entity: Scm, pluginInfos: PluginInfos, onSuccessfulSave: (msg: m.Children) => any) {
    super(entity, pluginInfos, onSuccessfulSave, false);
  }

  title(): string {
    return `克隆算法启动插件 ${this.originalEntityName}`;
  }

  operationPromise(): Promise<any> {
    return PluggableScmCRUD.create(this.entity());
  }

  successMessage(): m.Children {
    return <span>算法启动器 <em>{this.entity().name()}</em> 创建成功!</span>;
  }

  fetchCompleted() {
    this.entity().id("");
    this.entity().name("");
  }
}

export class DeletePluggableScmModal extends DeleteConfirmModal {
  private readonly onSuccessfulSave: (msg: m.Children) => any;

  constructor(pkgRepo: Scm,
              onSuccessfulSave: (msg: m.Children) => any) {
    super(DeletePluggableScmModal.deleteConfirmationMessage(pkgRepo),
          () => this.delete(pkgRepo), "您确定吗?");
    this.onSuccessfulSave = onSuccessfulSave;
  }

  private static deleteConfirmationMessage(scm: Scm) {
    return <span>
          您确定要删除算法启动器吗 <strong>{scm.name()}</strong>?
        </span>;
  }

  private delete(obj: Scm) {
    return PluggableScmCRUD
      .delete(obj.name())
      .then((result) => {
        result.do(
          () => {
            this.onSuccessfulSave(
              <span>算法启动器 <em>{obj.name()}</em> 删除成功!</span>
            );
            this.close();
          },
          (errorResponse: ErrorResponse) => {
            this.errorMessage = errorResponse.message;
            if (errorResponse.body) {
              this.errorMessage = JSON.parse(errorResponse.body).message;
            }
          }
        );
      });
  }
}
