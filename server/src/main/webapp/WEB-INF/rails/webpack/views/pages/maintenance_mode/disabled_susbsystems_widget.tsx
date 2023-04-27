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
import * as Icons from "views/components/icons";
import styles from "./index.scss";

import {MithrilViewComponent} from "jsx/mithril-component";
import {MaintenanceModeInfo, RunningSystem} from "models/maintenance_mode/types";

interface Attrs {
  maintenanceModeInfo: MaintenanceModeInfo;
}

class InformationWhenNotInMaintenanceMode extends MithrilViewComponent<Attrs> {
  view(vnode: m.Vnode<Attrs>) {
    return <div data-test-id="info-when-not-in-maintenance-mode">
      <h3 data-test-id="info-when-not-in-maintenance-mode-header">启用服务器维护模式将:</h3>
      <ul class={styles.gocdSubSystemInfo}>
        <SubsystemInfoWithIconWidget isReadOnly={true}
                                     dataTestId={"stop-material"}
                                     text={"停止资料子系统，这样不会有新的资源被轮询拉取."}/>
        <SubsystemInfoWithIconWidget isReadOnly={true}
                                     dataTestId="stop-config-repo"
                                     text={"停止轮询配置仓库."}/>
        <SubsystemInfoWithIconWidget isReadOnly={true}
                                     dataTestId="stop-pipeline-scheduling"
                                     text={"停止调度子系统，这样不会有新的算法实例被调度（自动或通过定时器）."}/>
        <SubsystemInfoWithIconWidget isReadOnly={true}
                                     dataTestId="stop-work-assignment"
                                     text={"停止节点子系统，这样处于空闲状态的节点不会去获取一个作业."}/>
        <SubsystemInfoWithIconWidget isReadOnly={true}
                                     dataTestId="stop-manual-trigger"
                                     text={"禁止用户启动一个算法."}/>
        <SubsystemInfoWithIconWidget isReadOnly={true}
                                     dataTestId="stop-config-changes"
                                     text={"禁用用户修改配置."}/>
        <SubsystemInfoWithIconWidget isReadOnly={true}
                                     dataTestId="stop-db-changes"
                                     text={"禁止用户修改数据库或文件系统状态的操作. "}/>
      </ul>
    </div>;
  }
}

interface RunningSystemAttrs {
  isReadOnly?: boolean;
  inProgress?: boolean;
  dataTestId: string;
  text: string;
}

class SubsystemInfoWithIconWidget extends MithrilViewComponent<RunningSystemAttrs> {
  view(vnode: m.Vnode<RunningSystemAttrs>) {
    let icon = (<Icons.Minus iconOnly={true}/>);

    if (!vnode.attrs.isReadOnly) {
      icon = vnode.attrs.inProgress
        ? <Icons.Spinner iconOnly={true}/>
        : <Icons.Check iconOnly={true}/>;
    }

    return <li data-test-id={vnode.attrs.dataTestId} class={styles.runningSystem}>
      {icon}
      <span class={styles.runningSystemText}>{vnode.attrs.text}</span>
    </li>;
  }
}

class InformationWhenInMaintenanceMode extends MithrilViewComponent<Attrs> {
  view(vnode: m.Vnode<Attrs>) {
    const runningSystem    = vnode.attrs.maintenanceModeInfo.runningSystem as RunningSystem;
    const mduRunningSystem = runningSystem.materialUpdateInProgress.count() === 0
      ? <SubsystemInfoWithIconWidget inProgress={false} dataTestId={"mdu-stopped"}
                                     text={"Stopped material subsystem."}/>
      : <SubsystemInfoWithIconWidget inProgress={true} dataTestId={"mdu-in-progress"}
                                     text={"Waiting for material subsystem to stop.."}/>;

    const buildingJobsSystem = runningSystem.buildingJobsGroupedByStages.length === 0
      ? <SubsystemInfoWithIconWidget inProgress={false} dataTestId={"scheduling-system-stopped"}
                                     text={"Stopped scheduling subsystem."}/>
      : <SubsystemInfoWithIconWidget inProgress={true} dataTestId={"scheduling-system-in-progress"}
                                     text={"Waiting for building jobs to finish.."}/>;

    return <div data-test-id="info-when-not-in-maintenance-mode">
      <ul class={styles.runningSubSystem} data-test-id="running-sub-systems">
        {mduRunningSystem}
        <SubsystemInfoWithIconWidget inProgress={false} dataTestId={"config-repo-polling-stopped"}
                                     text={"Stopped polling on config repositories."}/>
        {buildingJobsSystem}
        <SubsystemInfoWithIconWidget inProgress={false} dataTestId={"agent-subsystem-stopped"}
                                     text={"Stopped assigning jobs to agents."}/>
        <SubsystemInfoWithIconWidget inProgress={false} dataTestId={"manual-trigger-stopped"}
                                     text={"Stopped pipeline triggers."}/>
        <SubsystemInfoWithIconWidget inProgress={false} dataTestId={"config-changes-stopped"}
                                     text={"Stopped config modifications."}/>
        <SubsystemInfoWithIconWidget inProgress={false} dataTestId={"db-changes-stopped"}
                                     text={"Stopped database and filesystem modifications."}/>
      </ul>
    </div>;
  }
}

export class DisabledSubsystemsWidget extends MithrilViewComponent<Attrs> {
  view(vnode: m.Vnode<Attrs>) {
    return vnode.attrs.maintenanceModeInfo.maintenanceModeState()
      ? <InformationWhenInMaintenanceMode maintenanceModeInfo={vnode.attrs.maintenanceModeInfo}/>
      : <InformationWhenNotInMaintenanceMode maintenanceModeInfo={vnode.attrs.maintenanceModeInfo}/>;
  }
}
