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
import Stream from "mithril/stream";
import {Scm} from "models/materials/pluggable_scm";
import s from "underscore.string";
import {Anchor} from "views/components/anchor/anchor";
import {CollapsiblePanel} from "views/components/collapsible_panel";
import {Clone, Delete, Edit, IconGroup, InfoCircle, Usage} from "views/components/icons";
import {KeyValuePair} from "views/components/key_value_pair";
import {CloneOperation, DeleteOperation, EditOperation} from "../page_operations";
import styles from "./index.scss";
import {OnErrorAttrs, PluggableSCMScrollOptions} from "./pluggable_scms_widget";

interface Attrs extends EditOperation<Scm>, CloneOperation<Scm>, DeleteOperation<Scm>, OnErrorAttrs {
  scm: Scm;
  disableActions: boolean;
  showUsages: (scm: Scm, e: MouseEvent) => void;
  scrollOptions: PluggableSCMScrollOptions;
}

export class PluggableScmWidget extends MithrilViewComponent<Attrs> {
  expanded: Stream<boolean> = Stream();

  oninit(vnode: m.Vnode<Attrs, this>): any {
    const {scrollOptions, scm} = vnode.attrs;
    const linked               = scrollOptions.sm.getTarget() === scm.name();

    this.expanded(linked);
  }

  view(vnode: m.Vnode<Attrs, this>): m.Children | void | null {
    const header = <KeyValuePair inline={true}
                                 data={PluggableScmWidget.headerMap(vnode.attrs.scm)}/>;

    const scm            = vnode.attrs.scm;
    const scmRepoDetails = new Map([
                                     ["Id", scm.id()],
                                     ["名称", scm.name()],
                                     ["插件 Id", scm.pluginMetadata().id()],
                                     ...Array.from(scm.configuration().asMap())
                                   ]);

    const disabled            = vnode.attrs.disableActions;
    const warningIcon         = disabled
      ? <span className={styles.warning}><InfoCircle title={`插件 '${scm.pluginMetadata().id()}' 未找到!`} iconOnly={true}/></span>
      : undefined;
    const definedInConfigRepo = scm.origin().isDefinedInConfigRepo();
    const actionButtons       = <IconGroup>
      <Edit data-test-id="pluggable-scm-edit"
            disabled={disabled || definedInConfigRepo}
            title={PluggableScmWidget.getMsgForOperation(disabled, scm, "edit")}
            onclick={vnode.attrs.onEdit.bind(this, scm)}/>
      <Clone data-test-id="pluggable-scm-clone"
             disabled={disabled || definedInConfigRepo}
             title={PluggableScmWidget.getMsgForOperation(disabled, scm, "clone")}
             onclick={vnode.attrs.onClone.bind(this, scm)}/>
      <Delete data-test-id="pluggable-scm-delete"
              disabled={definedInConfigRepo}
              title={PluggableScmWidget.getMsgForOperation(disabled, scm, "delete")}
              onclick={vnode.attrs.onDelete.bind(this, scm)}/>
      <Usage data-test-id="pluggable-scm-usages"
             title={PluggableScmWidget.getMsgForOperation(disabled, scm, "show usages for")}
             onclick={vnode.attrs.showUsages.bind(this, scm)}/>
    </IconGroup>;

    const onNavigate = () => {
      if (vnode.attrs.scrollOptions.sm.getTarget() === scm.name() && vnode.attrs.scrollOptions.shouldOpenEditView) {
        if (scm.origin().isDefinedInConfigRepo()) {
          vnode.attrs.onError(`Cannot edit '${scm.name()}' as it is defined in config repo '${scm.origin().id()}'`);
        } else {
          vnode.attrs.onEdit(scm, new MouseEvent("click"));
        }
      }
      this.expanded(true);
    };

    return <Anchor id={scm.name()}
                   sm={vnode.attrs.scrollOptions.sm}
                   onnavigate={onNavigate}>
      <CollapsiblePanel error={disabled}
                        header={header} actions={[warningIcon, actionButtons]}
                        dataTestId={"pluggable-scm-panel"}
                        vm={this}>
        <KeyValuePair data-test-id={"pluggable-scm-details"} data={scmRepoDetails}/>
      </CollapsiblePanel>
    </Anchor>;
  }

  private static headerMap(scm: Scm) {
    const map = new Map();
    map.set("名称", scm.name());
    map.set("插件 Id", scm.pluginMetadata().id());
    return map;
  }

  private static getMsgForOperation(disabled: boolean, scm: Scm, operation: "edit" | "clone" | "delete" | "show usages for"): string {
    if (disabled && (operation === "edit" || operation === "clone")) {
      return `插件 '${scm.pluginMetadata().id()}' 未找到!`;
    } else if (scm.origin().isDefinedInConfigRepo()) {
      return `Cannot ${operation} as '${scm.name()}' is defined in config repo '${scm.origin().id()}'`;
    }
    let strOpera:string=""
    if (operation === "delete") {
      strOpera = "删除"
    } else if (operation === "clone") {
      strOpera = "克隆"
    } else if (operation === "edit") {
      strOpera = "编辑"
    } else if (operation === "show usages for") {
      strOpera = "使用"
    }
    return `${strOpera} 算法启动插件 '${scm.name()}'`;
  }
}
