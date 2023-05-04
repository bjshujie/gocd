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

import _ from "lodash";
import m from "mithril";
import {PipelineConfig, TrackingTool} from "models/pipeline_configs/pipeline_config";
import {TemplateConfig} from "models/pipeline_configs/template_config";
import {Form} from "views/components/forms/form";
import {TextField} from "views/components/forms/input_fields";
import {Help} from "views/components/tooltip";
import {TabContent} from "views/pages/clicky_pipeline_config/tabs/tab_content";
import {PipelineConfigRouteParams} from "views/pages/clicky_pipeline_config/tab_handler";

export class ProjectManagementTabContent extends TabContent<PipelineConfig> {
  static tabName(): string {

    return "项目管理";
  }

  hideRequiredAsterix(trackingTool: TrackingTool) {
    return _.isEmpty(trackingTool.regex()) && _.isEmpty(trackingTool.urlPattern());
  }

  protected selectedEntity(pipelineConfig: PipelineConfig, routeParams: PipelineConfigRouteParams): PipelineConfig {
    return pipelineConfig;
  }

  protected renderer(entity: PipelineConfig, templateConfig: TemplateConfig) {
    return <div>
      <h3>跟踪工具集成
        <Help
          content={"可用于指定指向问题跟踪器的链接，服务器将基本消息生成一个链接."}/>
      </h3>
      <Form compactForm={true}>
        <TextField property={entity.trackingTool().regex}
                   label={"模式"}
                   readonly={entity.isDefinedInConfigRepo()}
                   errorText={entity.trackingTool().errors().errorsForDisplay("regex")}
                   helpText={"一个正则表达式，用于从签入注释中识别卡号或错误号。"}
                   docLink={"integration"}
                   hideRequiredAsterix={this.hideRequiredAsterix(entity.trackingTool())}
                   dataTestId={"project-management-pattern"}
                   required={true}/>

        <TextField property={entity.trackingTool().urlPattern}
                   label={"URI"}
                   readonly={entity.isDefinedInConfigRepo()}
                   errorText={entity.trackingTool().errors().errorsForDisplay("urlPattern")}
                   helpText={"跟踪工具的URI。这必须包含字符串$｛ID｝，该字符串将被替换为使用模式标识的数字."}
                   docLink={"integration"}
                   dataTestId={"project-management-uri"}
                   hideRequiredAsterix={this.hideRequiredAsterix(entity.trackingTool())}
                   required={true}/>
      </Form>
    </div>;
  }
}
