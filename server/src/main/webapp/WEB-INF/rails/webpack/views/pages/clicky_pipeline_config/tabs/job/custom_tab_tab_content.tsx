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
import {Job} from "models/pipeline_configs/job";
import {PipelineConfig} from "models/pipeline_configs/pipeline_config";
import {Tab, Tabs} from "models/pipeline_configs/tab";
import {TemplateConfig} from "models/pipeline_configs/template_config";
import {Secondary} from "views/components/buttons";
import {FlashMessage, MessageType} from "views/components/flash_message";
import {HelpText, TextField} from "views/components/forms/input_fields";
import * as Icons from "views/components/icons";
import * as Tooltip from "views/components/tooltip";
import {TooltipSize} from "views/components/tooltip";
import {TabContent} from "views/pages/clicky_pipeline_config/tabs/tab_content";
import {PipelineConfigRouteParams} from "views/pages/clicky_pipeline_config/tab_handler";
import styles from "./custom_tabs.scss";

export class CustomTabTabContent extends TabContent<Job> {

  static tabName(): string {
    return "自定义选项卡";
  }

  protected renderer(entity: Job, templateConfig: TemplateConfig): m.Children {
    const readonly = this.isEntityDefinedInConfigRepository();
    const msg      = "自定义选项卡允许您在“作业详细信息”页面中添加新选项卡.";
    const docLink  = <HelpText helpText=" "
                               docLink="faq/dev_see_artifact_as_tab.html"
                               helpTextId={`custom-tab-doc-link`}/>;

    const flashMsg = <FlashMessage type={MessageType.info}>{msg} {docLink}</FlashMessage>;
    return (<div class={styles.mainContainer} data-test-id="custom-tabs">
      {flashMsg}
      {this.getTabView(entity.tabs(), readonly)}
      {this.getAddTabBtn(entity.tabs(), readonly)}
    </div>);
  }

  protected selectedEntity(pipelineConfig: PipelineConfig, routeParams: PipelineConfigRouteParams): Job {
    return pipelineConfig.stages().findByName(routeParams.stage_name!)!.jobs().findByName(routeParams.job_name!)!;
  }

  private addEmptyTab(tabs: Tabs) {
    const tab = new Tab("", "");
    return tabs.push(tab);
  }

  private getAddTabBtn(tabs: Tabs, readonly: boolean) {
    if (readonly) {
      return;
    }

  return (<Secondary small={true}
                     dataTestId={"add-custom-tab-button"}
                     onclick={this.addEmptyTab.bind(null, tabs)}>
    + 新增
  </Secondary>);
  }

  private getTabView(tabs: Tabs, readonly: boolean) {
    const tabsHeader = (<div class={styles.tabsHeader} data-test-id="tabs-header">
      <span data-test-id="name-header">
        选项卡名称: <Tooltip.Info size={TooltipSize.small}
                                content={"将显示在作业详细信息页面中的选项卡的名称."}/>
      </span>
      <span data-test-id="path-header">
        路径: <Tooltip.Info size={TooltipSize.small}
                            content={"将在自定义选项卡中呈现的文档。这通常是一个html或xml文件."}/>
      </span>
    </div>);

    if (tabs.length === 0) {
      this.addEmptyTab(tabs);
    }

    const tabsView = tabs.map((tab, index) => {
      let removeTab: m.Children;
      if (!readonly) {
        removeTab = <Icons.Close data-test-id={`remove-tab-${tab.name()}`}
                                 iconOnly={true}
                                 onclick={() => this.removeEntity(tab, tabs)}/>;
      }

      return (<div class={styles.tabContainer} data-test-id={`tab-${index}`}>
        <TextField dataTestId={`tab-name-${tab.name()}`}
                   readonly={readonly}
                   errorText={tab.errors().errorsForDisplay("name")}
                   placeholder="名称" property={tab.name}/>
        <TextField dataTestId={`tab-path-${tab.path()}`}
                   readonly={readonly}
                   errorText={tab.errors().errorsForDisplay("path")}
                   placeholder="路径"
                   property={tab.path}/>
        {removeTab}
      </div>);
    });

    return <div data-test-id="tabs-container">
      {tabsHeader}
      {tabsView}
    </div>;
  }

  private removeEntity(entityToRemove: Tab, collection: Tabs) {
    _.remove(collection, (t) => t.name() === entityToRemove.name() && t.path() === entityToRemove.path());
  }
}
