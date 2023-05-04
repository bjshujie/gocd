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
import {PipelineParameter} from "models/pipeline_configs/parameter";
import * as Buttons from "views/components/buttons";
import {ButtonIcon, Secondary} from "views/components/buttons";
import {IdentifierInputField} from "views/components/forms/common_validating_inputs";
import {Form, FormBody} from "views/components/forms/form";
import {TextField} from "views/components/forms/input_fields";
import {Table} from "views/components/table";
import * as Tooltip from "views/components/tooltip";
import {TooltipSize} from "views/components/tooltip";
import css from "./parameters_editor.scss";

interface Attrs {
  parameters: Stream<PipelineParameter[]>;
  paramList: Stream<PipelineParameter[]>;
  readonly: boolean;
}

export class PipelineParametersEditor extends MithrilViewComponent<Attrs> {
  notifyChange: () => void = _.noop;

  oninit(vnode: m.Vnode<Attrs>) {
    vnode.attrs.paramList(vnode.attrs.parameters().filter((p) => !p.isEmpty()).concat(new PipelineParameter("", "")));
  }

  oncreate(vnode: m.VnodeDOM<Attrs>) {
    this.notifyChange = () => vnode.dom.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  }

  view(vnode: m.Vnode<Attrs>) {
    let addParameterBtn: m.Children;

    if (!vnode.attrs.readonly) {
      addParameterBtn = <Secondary small={true}
                                   dataTestId={"add-param"}
                                   icon={ButtonIcon.ADD}
                                   onclick={this.add.bind(this, vnode.attrs.paramList)}>
        新增
      </Secondary>;
    }

    return (
      <FormBody>
        <Form last={true} compactForm={true}>
          <div class={css.parameters}>
            <label>
              参数
              <Tooltip.Help size={TooltipSize.medium}
                            content={<span>参数有助于减少配置中的重复，与模板相结合可以设置复杂的配置. <a
                              href="https://docs.gocd.org/current/configuration/admin_use_parameters_in_configuration.html">阅读更多</a></span>}/>
            </label>
            <Table headers={["名称", "值", ""]} data={
              _.map(vnode.attrs.paramList(), (param, i) => {
                const elements = [
                  <IdentifierInputField dataTestId={`form-field-input-param-name-${i}`}
                                        property={param.name}
                                        readonly={vnode.attrs.readonly}
                                        errorText={param.errors().errorsForDisplay("name")}
                                        onchange={this.update.bind(this,
                                                                   vnode.attrs.parameters,
                                                                   vnode.attrs.paramList)}/>,
                  <TextField dataTestId={`form-field-input-param-value-${i}`}
                             property={param.value}
                             readonly={vnode.attrs.readonly}
                             onchange={this.update.bind(this, vnode.attrs.parameters, vnode.attrs.paramList)}/>
                ];

                if (!vnode.attrs.readonly) {
                  elements.push(<Buttons.Cancel small={true} icon={Buttons.ButtonIcon.REMOVE}
                                                onclick={this.remove.bind(this,
                                                                          vnode.attrs.parameters,
                                                                          vnode.attrs.paramList,
                                                                          param)}/>);
                }

                return elements;
              })
            }/>
            {addParameterBtn}
          </div>
        </Form>
      </FormBody>
    );
  }

  update(params: Stream<PipelineParameter[]>, paramsList: Stream<PipelineParameter[]>, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    params(paramsList().filter((p) => !p.isEmpty()));
    this.notifyChange();
  }

  add(paramsList: Stream<PipelineParameter[]>, event: Event) {
    event.stopPropagation();
    paramsList().push(new PipelineParameter("", ""));
  }

  remove(params: Stream<PipelineParameter[]>,
         paramsList: Stream<PipelineParameter[]>,
         paramToDelete: PipelineParameter,
         event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    paramsList(paramsList().filter((p) => p !== paramToDelete));

    if (!paramsList().length) {
      paramsList([new PipelineParameter("", "")]);
    }

    this.update(params, paramsList);
  }
}
