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
import {docsUrl} from "gen/gocd_version";
import {MithrilViewComponent} from "jsx/mithril-component";
import m from "mithril";
import {MaintenanceModeInfo, RunningSystem, StageLocator} from "models/maintenance_mode/types";
import {Link} from "views/components/link";
import {SwitchBtn} from "views/components/switch";
import * as Tooltip from "views/components/tooltip";
import {TooltipSize} from "views/components/tooltip";
import {DisabledSubsystemsWidget} from "views/pages/maintenance_mode/disabled_susbsystems_widget";
import {JobInfoWidget} from "views/pages/maintenance_mode/running_jobs_widget";
import {MDUInfoWidget} from "views/pages/maintenance_mode/running_mdus_widget";
import styles from "./index.scss";

interface Attrs {
  maintenanceModeInfo: MaintenanceModeInfo;
  toggleMaintenanceMode: (e: Event) => void;
  onCancelStage: (stageLocator: StageLocator) => void;
}

export class MaintenanceModeWidget extends MithrilViewComponent<Attrs> {
  view(vnode: m.Vnode<Attrs>) {
    const maintenanceModeInfo = vnode.attrs.maintenanceModeInfo;

    let mayBeMaintenanceInfo;
    if (maintenanceModeInfo.maintenanceModeState()) {
      mayBeMaintenanceInfo = (
        <div data-test-id="in-progress-subsystems" class={styles.inProgressSubsystems}>
          <MaintenanceModeInfoWidget maintenanceModeInfo={vnode.attrs.maintenanceModeInfo} onCancelStage={vnode.attrs.onCancelStage}/>
        </div>
      );
    }

    let maintenanceModeStateMessage = "";
    if (maintenanceModeInfo.maintenanceModeState()) {
      maintenanceModeStateMessage = maintenanceModeInfo.hasRunningSystems
        ? "一些子系统仍在进行中。"
        : "服务器没有正在运行的子系统。";
    }

    let updatedByMessage = "服务器维护模式默认关闭.";
    if (maintenanceModeInfo.metdata.updatedBy !== null) {
      if (maintenanceModeInfo.metdata.updatedBy === "GoCD") {
        updatedByMessage = `服务器在 ${maintenanceModeInfo.metdata.updatedOn} 开始了维护模式.`;
      } else {
        updatedByMessage = `${maintenanceModeInfo.metdata.updatedBy} 在 ${maintenanceModeInfo.metdata.updatedOn} 更改了维护模式状态。`;
      }
    }

    return (
      <div class={styles.maintenanceModeWidget} data-test-id="maintenance-mode-widget">
        <p data-test-id="maintenance-mode-description" class={styles.maintenanceModeDescription}>
          当服务器处于维护模式，服务器在备份时无任何作业正运行，可以安全的重新启动或升级
          &nbsp;
          <Link target="_blank" href={docsUrl("/advanced_usage/maintenance_mode.html")}>学习更多..</Link>
        </p>

        <div class={styles.maintenanceModeInfo}>
          <span data-test-id="maintenance-mode-updated-by-info" class={styles.updatedBy}>
            {updatedByMessage}
          </span>
          <span class={styles.switchWrapper} data-test-id="switch-wrapper">
            <span class={styles.maintenanceModeLabel}>启用维护模式:</span>
            <SwitchBtn inProgress={maintenanceModeInfo.maintenanceModeState() && maintenanceModeInfo.hasRunningSystems}
                       field={() => maintenanceModeInfo.maintenanceModeState()}
                       onclick={vnode.attrs.toggleMaintenanceMode}/>
            <div class={styles.maintenanceModeStateMessage}>{maintenanceModeStateMessage}</div>
          </span>
        </div>
        <DisabledSubsystemsWidget maintenanceModeInfo={maintenanceModeInfo}/>
        {mayBeMaintenanceInfo}
      </div>
    );
  }
}

interface InfoAttrs {
  maintenanceModeInfo: MaintenanceModeInfo;
  onCancelStage: (stageLocator: StageLocator) => void;
}

export class MaintenanceModeInfoWidget extends MithrilViewComponent<InfoAttrs> {
  view(vnode: m.Vnode<InfoAttrs>): m.Children {
    return [
      <JobInfoWidget stages={(vnode.attrs.maintenanceModeInfo.runningSystem as RunningSystem).buildingJobsGroupedByStages}
                     title={"正在运行的阶段"}
                     onCancelStage={vnode.attrs.onCancelStage}/>,
      <MDUInfoWidget materials={(vnode.attrs.maintenanceModeInfo.runningSystem as RunningSystem).materialUpdateInProgress}/>,
      <JobInfoWidget stages={(vnode.attrs.maintenanceModeInfo.runningSystem as RunningSystem).scheduledJobsGroupedByStages}
                     title={<span class={styles.scheduledStagesTitleWrapper}>
                       <div class={styles.scheduledStagesTitle}> 已调度的阶段 </div>
                       <Tooltip.Info size={TooltipSize.large}
                                     content={"已调度的阶段包含已调度但尚未分配给任何节点的作业。由于在维护模式期间停止了对节点的作业分配，因此调度的作业不会对服务器状态产生副作用。因此，在考虑服务器维护模式时，会忽略计划阶段。"}/>
                     </span>}
                     onCancelStage={vnode.attrs.onCancelStage}/>,
    ] as m.ChildArray;
  }
}
