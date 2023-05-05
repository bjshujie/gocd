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

import m from "mithril";
import {PipelineConfig} from "models/pipeline_configs/pipeline_config";
import {Stage} from "models/pipeline_configs/stage";
import {TemplateConfig} from "models/pipeline_configs/template_config";
import {Form} from "views/components/forms/form";
import {CheckboxField, RadioField, TextField} from "views/components/forms/input_fields";
import {TabContent} from "views/pages/clicky_pipeline_config/tabs/tab_content";
import {PipelineConfigRouteParams} from "views/pages/clicky_pipeline_config/tab_handler";

export class GeneralOptionsTabContent extends TabContent<PipelineConfig> {
  static tabName(): string {
    return "General";
  }

  getPipelineSchedulingCheckBox(entity: PipelineConfig, templateConfig: TemplateConfig) {
    let additionalHelpText: string = "";
    if (entity.isUsingTemplate()) {
      additionalHelpText = ` 因为该算法基于 '${entity.template()}' 模板, 决定算法的自动/手动动作在模板的第一个阶段被设置.`;
    }

    const stage: Stage = entity.template() ? templateConfig.firstStage() : entity.firstStage();
    if (stage) {
      return <CheckboxField label="自动算法调度"
                            errorText={entity.errors().errorsForDisplay("")}
                            dataTestId={"automatic-pipeline-scheduling"}
                            readonly={entity.isDefinedInConfigRepo() || entity.isUsingTemplate()}
                            helpText={`如果未勾选，算法将只能通过手动/API/定时器启动. 未勾选与在第一阶段设置为手动相同.${additionalHelpText}`}
                            property={stage.approval().typeAsStream()}/>;
    }
  }

  protected renderer(entity: PipelineConfig, templateConfig: TemplateConfig): m.Children {
    return <div>
      <h3>基本设置</h3>
      <Form compactForm={true}>
        <TextField property={entity.labelTemplate}
                   label={"标签模板"}
                   errorText={entity.errors().errorsForDisplay("labelTemplate")}
                   helpText={"自定义标签."}
                   docLink={"configuration/pipeline_labeling.html"}
                   placeholder={"${COUNT}"}
                   readonly={entity.isDefinedInConfigRepo()}
                   dataTestId={"label-template"}/>
        {this.getPipelineSchedulingCheckBox(entity, templateConfig)}
      </Form>

      <h3>定时器设置</h3>
      <Form compactForm={true}>
        <TextField property={entity.timer().spec}
                   label={"Cron 计时器规范"}
                   errorText={entity.timer().errors().errorsForDisplay("spec")}
                   readonly={entity.isDefinedInConfigRepo()}
                   dataTestId={"cron-timer"}
                   helpText={"类Cron规范的定时器调度算法，例如要设置每周一致周五22：00运行算法一次，可设置Cron规范为 '0 0 22 ? * MON-FRI'."}
                   docLink={"configuration/admin_timer.html"}/>

      </Form>

      <h3>计算锁定行为设置</h3>
      <Form compactForm={true}>
        <RadioField property={entity.lockBehavior}
                    readonly={entity.isDefinedInConfigRepo()}
                    possibleValues={[
                      {
                        label: "每次仅运行一个算法实例",
                        value: "unlockWhenFinished",
                        helpText: "每次仅有一个算法实例在运行，并且当算法失败时不锁定。算法被锁定仅用于保证同时仅有一个算法实例在运行，当算法计算完成或到达了一个需要手工启动的阶段时，算法解除锁定"
                      },
                      {
                        label: "仅运行一个算法实例，当算法失败时锁定",
                        value: "lockOnFailure",
                        helpText: "每次仅有一个算法实例在运行，并且当算法失败时算法被锁定.算法可以手工解除锁定或者当算法执行到了最后的阶段解除锁定，而无论算法的状态如何."
                      },
                      {
                        label: "同时运行多个算法实例 (默认)",
                        value: "none",
                        helpText: "算法不会被锁定，并且算法的多个实例允许同时运行 (默认)."
                      },
                    ]}>
        </RadioField>
      </Form>
    </div>;
  }

  protected selectedEntity(pipelineConfig: PipelineConfig, routeParams: PipelineConfigRouteParams): PipelineConfig {
    return pipelineConfig;
  }
}
