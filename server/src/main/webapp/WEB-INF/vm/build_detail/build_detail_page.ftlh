<#--
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
 -->
<#assign title = "${presenter.buildName} 作业详情 - 凌波">
<#assign _page_title = "作业详情: ${presenter.buildLocatorForDisplay}">
<#assign current_tab = "build">
<#include "../shared/_header.ftlh">

<#include "_build_detail_summary_jstemplate.ftlh">
<div id="yui-main">
  <div class="yui-b">
    <!-- breadcrumbs -->
      <#assign current_page="build_detail">
      <#assign pipelineName="${presenter.pipelineName}">
      <#assign stageLocator="${presenter.stageLocator}">

      <#include "../shared/_job_details_breadcrumbs.ftlh">
    <!-- /breadcrumbs -->

    <div class="content_wrapper_outer">
      <div class="row">
        <div class="content_wrapper_inner">
          <div id="build-status-panel" class="bd-container rounded-corner-for-pipeline">
            <div class="maincol build_detail">
                <#include "../shared/_flash_message.ftlh">
                <#assign jobConfigName = "${presenter.buildName}">
              <div id="build_detail_summary_container" class="build_detail_summary">
                <ul id="build-detail-summary" class="summary">
                  <li><span class="header">启动时间: </span><span id="build_scheduled_date">Loading...</span></li>
                  <li><span class="header">节点: </span><span id="agent_name">Loading...</span></li>
                  <li><span class="header">完成时间: </span><span id="build_completed_date">Loading...</span></li>
                  <li><span class="header">构建原因: </span><span
                    id="stage-${presenter.id?c}-buildCause">${presenter.buildCauseMessage}</span></li>
                  <li class="timer_area">
                    <div class="progress-info">
                      <div id="${presenter.buildName}_progress_bar" class="progress-bar" style="display: none;">
                        <div id="${presenter.buildName}_progress" class="progress"></div>
                      </div>
                      <div class="progress-eta">
                        <span class="header" id="${presenter.buildName}_time_remaining_label"></span>
                        <span id="${presenter.buildName}_time_remaining">&nbsp;</span>
                      </div>
                    </div>
                  </li>
                </ul>
                <div class="clear"></div>
              </div>

              <div class="job_details_content" data-pipeline="${presenter.pipelineName}" data-pipeline-counter="${presenter.pipelineCounter?c}" data-pipeline-label="${presenter.pipelineLabel}" data-stage="${presenter.stageName}" data-stage-counter="${presenter.stageCounter}" data-job="${presenter.id?c}" data-build="${presenter.buildName}" data-result="${presenter.result}" data-websocket="${websocketEnabled?string("enabled", "disabled")}">
                <div class="sub_tabs_container">
                  <ul>
                    <li class="current_tab" id="build_console">
                      <a class="tab_button_body_match_text">console</a>
                      <a>控制台</a>
                    </li>
                    <li>
                      <a class="tab_button_body_match_text">tests</a>
                      <a>测试</a>
                    </li>
                    <li>
                      <a class="tab_button_body_match_text">artifacts</a>
                      <a>文档</a>
                    </li>
                    <li>
                      <a class="tab_button_body_match_text">materials</a>
                      <a>算法启动插件</a>
                    </li>
                    <#list presenter.customizedTabs as tab>
                        <li>
                          <a class="tab_button_body_match_text">${tab.name?lower_case}</a>
                          <a>${tab.name}</a>
                        </li>
                    </#list>
                  </ul>
                  <a href="#" id="link-to-this-page"
                     title="此选项卡的永久链接，您可以与其他团队成员共享此url。">本选项卡连接</a>

                  <div class="clear"></div>
                </div>

              <div class="sidebar_history">
                  <#include "../sidebar/_sidebar_build_list.ftlh">
              </div>
                <div class="build_detail_container sub_tab_container rounded-corner-for-tab-container">


                  <div class="sub_tab_container_content">
                    <div class="clear"></div>

                      <#assign buildoutput_extra_attrs="">
                      <#include "_buildoutput.ftlh">

                      <#assign tests_extra_attrs="style='display:none'">
                      <#include "_tests.ftlh">

                      <#assign artifacts_extra_attrs="style='display:none'">
                      <#include "_artifacts.ftlh">

                      <#assign modification_extra_attrs="style='display:none'">
                      <#include "_materials.ftlh">
                      <#list presenter.customizedTabs as tab>
                        <#assign customized_name="${tab.name}">
                        <#assign customized_path="${tab.path}">
                        <#include "_customized.ftlh">
                      </#list>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</div>
<#include "../shared/_footer.ftlh">
