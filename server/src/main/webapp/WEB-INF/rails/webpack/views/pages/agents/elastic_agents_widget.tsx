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

import classNames from "classnames/bind";
import {SparkRoutes} from "helpers/spark_routes";
import {MithrilViewComponent} from "jsx/mithril-component";
import m from "mithril";
import {Agent, AgentConfigState} from "models/agents/agents";
import {ElasticAgentVM} from "models/agents/agents_vm";
import {PluginInfos} from "models/shared/plugin_infos_new/plugin_info";
import {SearchField} from "views/components/forms/input_fields";
import {HeaderIcon} from "views/components/header_icon";
import {KeyValuePair} from "views/components/key_value_pair";
import {Table} from "views/components/table";
import {AgentStatusWidget} from "views/pages/agents/agent_status_widget";
import {RequiresPluginInfos} from "views/pages/page_operations";
import style from "./index.scss";

const classnames = classNames.bind(style);

interface AgentsWidgetAttrs extends RequiresPluginInfos {
  agentsVM: ElasticAgentVM;
  isUserAdmin: boolean;
}

export class ElasticAgentsWidget extends MithrilViewComponent<AgentsWidgetAttrs> {
  view(vnode: m.Vnode<AgentsWidgetAttrs>) {
    const tableData = vnode.attrs.agentsVM.list().map((agent: Agent) => {
      const tableCellClasses = ElasticAgentsWidget.tableCellClasses(agent);
      return [
        <div class={tableCellClasses}>{this.pluginIcon(vnode.attrs.pluginInfos(), agent)}</div>,
        <div class={classnames(tableCellClasses, style.hostname)} data-test-id={`agent-hostname-of-${agent.uuid}`}>
          {ElasticAgentsWidget.getHostnameLink(vnode.attrs.isUserAdmin, agent)}
        </div>,
        <div class={tableCellClasses} data-test-id={`agent-sandbox-of-${agent.uuid}`}>{agent.sandbox}</div>,
        <div class={tableCellClasses}
             data-test-id={`agent-operating-system-of-${agent.uuid}`}>{agent.operatingSystem}</div>,
        <div class={tableCellClasses}
             data-test-id={`agent-ip-address-of-${agent.uuid}`}>{agent.ipAddress}</div>,
        <AgentStatusWidget agent={agent}
                           buildDetailsForAgent={vnode.attrs.agentsVM.showBuildDetailsForAgent}
                           cssClasses={tableCellClasses}/>,
        <div class={tableCellClasses}
             data-test-id={`agent-free-space-of-${agent.uuid}`}>{agent.readableFreeSpace()}</div>,
        <div class={tableCellClasses}
             data-test-id={`agent-environments-of-${agent.uuid}`}>{ElasticAgentsWidget.joinOrNoneSpecified(agent.environmentNames())}</div>
      ];
    });

    return <div class={style.agentsTable}
                onclick={ElasticAgentsWidget.hideBuildDetails.bind(this, vnode.attrs.agentsVM)}>
      <div class={style.headerPanel}>
        <div class={style.leftContainer}>
          <KeyValuePair inline={true} data={new Map(
            [
              ["总数", this.span(vnode.attrs.agentsVM.list().length)],
              ["挂起", this.span(vnode.attrs.agentsVM.filterBy(AgentConfigState.Pending).length)],
              ["启用", this.span(vnode.attrs.agentsVM.filterBy(AgentConfigState.Enabled).length, style.enabled)],
              ["禁用", this.span(vnode.attrs.agentsVM.filterBy(AgentConfigState.Disabled).length, style.disabled)]
            ])
          }/>
        </div>

        <SearchField placeholder="过虑节点" label="Search for agents" property={vnode.attrs.agentsVM.filterText}/>
      </div>
      <Table data={tableData}
             headers={["", "节点名称", "沙盒", "操作系统", "IP 地址", "状态", "剩余空间", "环境"]}
             sortHandler={vnode.attrs.agentsVM.agentsSortHandler}/>
    </div>;
  }

  private static joinOrNoneSpecified(array: string[]): m.Children {
    if (array && array.length > 0) {
      return array.join(", ");
    } else {
      return (<em>未指定</em>);
    }
  }

  private static hideBuildDetails(agentsVM: ElasticAgentVM) {
    agentsVM.showBuildDetailsForAgent("");
  }

  private static tableCellClasses(agent: Agent) {
    return classnames(style.tableCell,
                      {[style.building]: agent.isBuilding()},
                      {[style.disabledAgent]: agent.agentConfigState === AgentConfigState.Disabled});
  }

  private static getHostnameLink(isUserAdmin: boolean, agent: Agent) {
    if (!isUserAdmin) {
      return (<span>{agent.hostname}</span>);
    }

    return <a href={SparkRoutes.agentJobRunHistoryPath(agent.uuid)}>{agent.hostname}</a>;
  }

  private span(count: number, className: string = ""): m.Children {
    return <span class={classnames(style.count, className)}>{count}</span>;
  }

  private pluginIcon(pluginInfos: PluginInfos, agent: Agent) {
    const pluginInfo = pluginInfos.findByPluginId(agent.elasticPluginId!);
    if (pluginInfo && pluginInfo.imageUrl) {
      return <HeaderIcon name="插件 Icon" imageUrl={pluginInfo.imageUrl} noMargin={true}/>;
    } else {
      return <HeaderIcon name="插件无 icon" noMargin={true}/>;
    }
  }
}
