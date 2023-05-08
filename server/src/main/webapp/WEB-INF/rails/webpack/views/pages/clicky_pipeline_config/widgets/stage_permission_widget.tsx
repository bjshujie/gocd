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
import {Stage} from "models/pipeline_configs/stage";
import {RadioField} from "views/components/forms/input_fields";
import style from "../index.scss";

interface Attrs {
  stage: Stage;
}

export class StagePermissionWidget extends MithrilViewComponent<Attrs> {
  readonly isInheritingFromPipelineGroup = Stream<"是" | "否">();

  oninit(vnode: m.Vnode<Attrs>) {
    this.isInheritingFromPipelineGroup(vnode.attrs.stage.approval().authorization().isEmpty() ? "是" : "否");
  }

  view(vnode: m.Vnode<Attrs>) {
    return <div>
      <h3>权限</h3>
      <span class={style.help}>所有系统管理员和算法组管理员都可以对此阶段进行操作（这一点无法被覆盖）.</span>
      <RadioField label={"该阶段:"}
                  property={this.isInheritingFromPipelineGroup}
                  inline={true}
                  possibleValues={[
                    {label: "继承自算法组", value: "Yes"},
                    {label: "本地指定", value: "No"}
                  ]}/>
    </div>;
  }
}
