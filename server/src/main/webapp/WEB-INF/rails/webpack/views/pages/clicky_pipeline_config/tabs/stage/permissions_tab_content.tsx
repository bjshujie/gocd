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
import _ from "lodash";
import m from "mithril";
import Stream from "mithril/stream";
import {PipelineGroup} from "models/admin_pipelines/admin_pipelines";
import {PipelineGroupCRUD} from "models/admin_pipelines/pipeline_groups_crud";
import {Authorization, AuthorizedUsersAndRoles} from "models/authorization/authorization";
import {Errors} from "models/mixins/errors";
import {PipelineConfig} from "models/pipeline_configs/pipeline_config";
import {Stage} from "models/pipeline_configs/stage";
import {TemplateConfig} from "models/pipeline_configs/template_config";
import {RolesCRUD} from "models/roles/roles_crud";
import {Secondary} from "views/components/buttons";
import {FlashMessage, MessageType} from "views/components/flash_message";
import {AutocompleteField, SuggestionProvider} from "views/components/forms/autocomplete";
import {RadioField, TextField} from "views/components/forms/input_fields";
import * as Icons from "views/components/icons/index";
import {TabContent} from "views/pages/clicky_pipeline_config/tabs/tab_content";
import {PipelineConfigRouteParams} from "views/pages/clicky_pipeline_config/tab_handler";
import styles from "./permissions.scss";

interface Attrs {
  entity: Stage;
  groupPermissions: Stream<PipelineGroup>;
  isEntityDefinedInConfigRepository: boolean;
  selectedPermission: Stream<string>;
  allRoles: Stream<string[]>;
}

export class PermissionsWidget extends MithrilViewComponent<Attrs> {
  oninit(vnode: m.Vnode<Attrs>) {
    const isInherited = vnode.attrs.entity.approval().authorization().isInherited();
    vnode.attrs.selectedPermission(isInherited ? "inherit" : "local");
  }

  view(vnode: m.Vnode<Attrs>) {
    const entity: Stage                           = vnode.attrs.entity;
    const groupPermissions: Stream<PipelineGroup> = vnode.attrs.groupPermissions;

    let permissionsView: m.Children;
    let localPermissionsMsg: m.Children;
    if (entity.approval().authorization().isInherited()) {
      if (groupPermissions().authorization().isConfigured()) {
        const users       = this.getInheritedUsers(vnode);
        const roles       = this.getInheritedRoles(vnode);
        const errors    = new Errors();
        permissionsView = this.localPermissionsView(users, roles, errors, true, vnode);
      } else {
        const msg       = "没有为此阶段及其算法组配置授权。只有管理员才能操作此阶段。";
        permissionsView = <FlashMessage message={msg} type={MessageType.info}/>;
      }
    } else {
      const users     = entity.approval().authorization()._users;
      const roles     = entity.approval().authorization()._roles;
      const errors    = entity.approval().authorization().errors();
      const msg       = "此管理所属的管理组已配置权限。您只能添加那些有权对此算法组进行操作的用户和角色.";

      localPermissionsMsg = <FlashMessage dataTestId="local-permission-msg" message={msg} type={MessageType.info}/>;
      permissionsView     = this.localPermissionsView(users, roles, errors, vnode.attrs.isEntityDefinedInConfigRepository, vnode);
    }

    const globalMsg = "所有系统管理员和算法组管理员都可以对此阶段进行操作（这一点无法被覆盖）.";
    return <div class={styles.mainContainer} data-test-id="permissions-tab">
      <FlashMessage type={MessageType.info} message={globalMsg}/>
      <h3 data-test-id="permissions-heading">阶段权限:</h3>
      <div class={styles.radioWrapper}>
        <RadioField onchange={this.onPermissionsToggleChange.bind(this, vnode, entity)}
                    property={vnode.attrs.selectedPermission}
                    readonly={vnode.attrs.isEntityDefinedInConfigRepository}
                    inline={true}
                    possibleValues={[
                      {
                        label: "继承自算法组",
                        value: "inherit",
                        helpText: "从算法组继承授权."
                      },
                      {
                        label: "本地指定",
                        value: "local",
                        helpText: "在本地定义特定权限。这将覆盖算法组授权."
                      }
                    ]}>
        </RadioField>
      </div>
      {localPermissionsMsg}
      {permissionsView}
    </div>;
  }

  private getInheritedRoles(vnode: m.Vnode<Attrs>) {
    const groupPermissions: Stream<PipelineGroup> = vnode.attrs.groupPermissions;
    const roles = groupPermissions().authorization().admin()._roles.concat(groupPermissions().authorization().operate()._roles);
    return _.uniqBy(roles, (ele: Stream<string>) => ele());
  }

  private getInheritedUsers(vnode: m.Vnode<Attrs>) {
    const groupPermissions: Stream<PipelineGroup> = vnode.attrs.groupPermissions;
    const users = groupPermissions().authorization().admin()._users.concat(groupPermissions().authorization().operate()._users);
    return _.uniqBy(users, (ele: Stream<string>) => ele());
  }

  private onPermissionsToggleChange(vnode: m.Vnode<Attrs>, entity: Stage, value: string) {
    if (value === "local" && entity.approval().authorization().isEmpty()) {
      const auth = new AuthorizedUsersAndRoles(this.getInheritedUsers(vnode), this.getInheritedRoles(vnode));
      entity.approval().authorization(auth);
      this.getInheritedRoles(vnode);
    }

    entity.approval().authorization().isInherited((value !== "local"));
  }

  private localPermissionsView(users: Array<Stream<string>>, roles: Array<Stream<string>>, errors: Errors, readOnly: boolean, vnode: m.Vnode<Attrs>) {
    return <div data-test-id="users-and-roles">
      <div data-test-id="users">
        <h3>用户</h3>
        <FlashMessage message={errors.errorsForDisplay("users")} dataTestId="users-errors" type={MessageType.alert}/>
        {users.map((user, index) => this.getInputField("username", user, users, index, new RolesSuggestionProvider(Stream([] as string[]), []), readOnly))}
        {this.addEntityButton(users, readOnly, "add-user-permission-button")}
      </div>

      <div data-test-id="roles">
        <h3>角色</h3>
        <FlashMessage message={errors.errorsForDisplay("roles")} dataTestId="roles-errors" type={MessageType.alert}/>
        {roles.map((role, index) => this.getInputField("role",role,roles,index,new RolesSuggestionProvider(vnode.attrs.allRoles,roles.map(s => s())),readOnly))}
        {this.addEntityButton(roles, readOnly, "add-role-permission-button")}
      </div>
    </div>;
  }

  private addEntityButton(collection: Array<Stream<string>>, readOnly: boolean, dataTestId: string) {
    if (readOnly) {
      return;
    }
    return (<Secondary small={true} dataTestId={dataTestId} onclick={() => collection.push(Stream())}>+ Add</Secondary>);
  }

  private getInputField(placeholder: string, entity: Stream<string>, collection: Array<Stream<string>>, index: number, provider: SuggestionProvider, readOnly: boolean) {
    let removeEntity: m.Children;
    let inputBox: m.Children;

    if (!readOnly) {
      removeEntity = <Icons.Close iconOnly={true} onclick={() => this.removeEntity(index, collection)}/>;
      inputBox     = <AutocompleteField placeholder={placeholder} provider={provider} property={entity}/>;
    } else {
      inputBox = <TextField readonly={readOnly} placeholder={placeholder} provider={provider} property={entity}/>;
    }

    return <div class={styles.inputFieldContainer} data-test-id={`input-field-for-${entity()}`}>
      {inputBox}{removeEntity}
    </div>;
  }

  private removeEntity(index: number, collection: Array<Stream<string>>) {
    _.pullAt(collection, [index]);
  }
}

export class PermissionsTabContent extends TabContent<Stage> {
  private groupPermissions: Stream<PipelineGroup> = Stream(new PipelineGroup("", new Authorization()));
  private allRoles: Stream<string[]>              = Stream([] as string[]);
  private selectedPermission: Stream<string>      = Stream();

  constructor() {
    super();
    this.fetchAllRoles();
    this.fetchGroupPermissions();
  }

  static tabName(): string {
    return "权限";
  }

  protected renderer(entity: Stage, templateConfig: TemplateConfig): m.Children {
    return <PermissionsWidget groupPermissions={this.groupPermissions}
                              allRoles={this.allRoles}
                              isEntityDefinedInConfigRepository={this.isEntityDefinedInConfigRepository()}
                              entity={entity}
                              selectedPermission={this.selectedPermission}/>;
  }

  protected selectedEntity(pipelineConfig: PipelineConfig, routeParams: PipelineConfigRouteParams): Stage {
    const stage = pipelineConfig.stages().findByName(routeParams.stage_name!)!;
    this.selectedPermission(stage.approval().authorization().isInherited() ? "inherit" : "local");
    return stage;
  }

  private fetchAllRoles() {
    RolesCRUD.all().then((rolesResult) => {
      rolesResult.do((successResponse) => {
        this.allRoles(successResponse.body.map(r => r.name()));
      });
    });
  }

  private getMeta(): any {
    const meta = document.body.getAttribute("data-meta");
    return meta ? JSON.parse(meta) : {};
  }

  private fetchGroupPermissions() {
    const self      = this;
    const groupName = this.getMeta().pipelineGroupName;

    if (!groupName) {
      return;
    }

    PipelineGroupCRUD.get(groupName).then((result) => {
      result.do((successResponse) => {
        self.groupPermissions(successResponse.body.object);
      });
    });
  }
}

export class RolesSuggestionProvider extends SuggestionProvider {
  private allRoles: Stream<string[]>;
  private configuredRoles: string[];

  constructor(allRoles: Stream<string[]>, configuredRoles: string[]) {
    super();
    this.allRoles        = allRoles;
    this.configuredRoles = configuredRoles;
  }

  getData(): Promise<Awesomplete.Suggestion[]> {
    return new Promise<Awesomplete.Suggestion[]>((resolve) => {
      resolve(_.difference(this.allRoles(), this.configuredRoles));
    });
  }
}
