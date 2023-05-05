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
import {Stage} from "models/pipeline_configs/stage";
import {IdentifierInputField} from "views/components/forms/common_validating_inputs";
import {Form, FormBody} from "views/components/forms/form";
import {SwitchBtn} from "views/components/switch/index";
import {TooltipSize} from "views/components/tooltip";
import * as Tooltip from "views/components/tooltip";
import {AdvancedSettings} from "views/pages/pipelines/advanced_settings";
import {IDENTIFIER_FORMAT_HELP_MESSAGE} from "./messages";

interface Attrs {
  stage: Stage;
}

export class StageEditor extends MithrilViewComponent<Attrs> {
  view(vnode: m.Vnode<Attrs>) {
    const stage = vnode.attrs.stage;

    return <FormBody>
      <Form last={true} compactForm={true}>
        <IdentifierInputField label="阶段名称" helpText={IDENTIFIER_FORMAT_HELP_MESSAGE} placeholder="阶段名称" property={stage.name} errorText={stage.errors().errorsForDisplay("name")} required={true}/>

        <AdvancedSettings>
          <SwitchBtn label={<div>
            上游更改自动运行此阶段
            <Tooltip.Help size={TooltipSize.medium} content="启用这意味着当更新或其前一个或上游阶段通过时，此阶段将自动运行。禁用此选项意味着您必须手动 启动此阶段"/>
          </div>} field={stage.approval().state} small={true}/>
        </AdvancedSettings>
      </Form>
    </FormBody>;
  }
}
