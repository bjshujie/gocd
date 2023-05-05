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
import {MithrilComponent} from "jsx/mithril-component";
import m from "mithril";
import {BackupProgressStatus, BackupStatus} from "models/backups/types";
import * as Buttons from "views/components/buttons";
import {FlashMessage, MessageType} from "views/components/flash_message";
import styles from "./index.scss";
import {ProgressIndicator} from "./progress_indicator";

export interface Attrs {
  lastBackupTime: Date | null | undefined;
  lastBackupUser: string | null | undefined;
  availableDiskSpace: string;
  backupLocation: string;
  message: string;
  backupStatus: BackupStatus;
  backupProgressStatus?: BackupProgressStatus;
  onPerformBackup: () => void;
  displayProgressIndicator: boolean;
}

export class BackupWidget extends MithrilComponent<Attrs> {
  view(vnode: m.Vnode<Attrs>) {
    let progressIndicator;
    if (vnode.attrs.displayProgressIndicator) {
      progressIndicator = <ProgressIndicator progressStatus={vnode.attrs.backupProgressStatus}
                                             status={vnode.attrs.backupStatus}
                                             message={vnode.attrs.message}/>;
    }
    return <div class={styles.backupContainer}>
      {this.topLevelError(vnode)}
      <div class={styles.content}>
        <div class={styles.performBackupContainer}>
          <div class={styles.performBackupSection}>
            <div class={styles.performBackupButtonContainer}>
              <Buttons.Primary data-test-id="perform-backup" onclick={this.startBackup.bind(this, vnode)}
                               disabled={vnode.attrs.backupStatus === BackupStatus.IN_PROGRESS}>
                执行备份
              </Buttons.Primary>
            </div>
            <div class={styles.backupInfo}>
              <p class={styles.availableDiskSpace}>
                <span>备份目录中的可用磁盘空间:</span> {vnode.attrs.availableDiskSpace}
              </p>
              {this.lastBackupDetails(vnode)}
            </div>
          </div>
          {progressIndicator}
          {this.backupConfigHelp(vnode)}
        </div>
        {this.backupHelp()}
      </div>
    </div>;
  }

  private lastBackupDetails(vnode: m.Vnode<Attrs>) {
    if (vnode.attrs.lastBackupTime && vnode.attrs.lastBackupUser) {
      return <p>最近一次备份由 <span>'{vnode.attrs.lastBackupUser}'</span> 于 <span>{vnode.attrs.lastBackupTime.toLocaleString()}进行</span>
      </p>;
    }
  }

  private backupHelp() {
    return <div class={styles.backupHelp}>
      <h3 class={styles.helpHeading}>正在执行备份, 将会创建:</h3>
      <ul class={styles.helpItem}>
        <li>
          <strong>配置</strong> - 名为<code>config-dir.zip</code>的归档文件，包含XML配置、Jetty服务器配置、密钥库和其他内部配置。
        </li>
        <li>
          <strong>包装器配置</strong> - 一个名为<code>wrapper-config-dir.zip</code>的归档文件，包含tanuki 包装器配置。
        </li>
        <li>
          <strong>数据库</strong> - 数据库被归档到一个名为<code>db.zip</code>的文件中，该文件用于恢复的数据库。
        </li>
        <li>
          <strong>配置历史</strong> - 一个名为<code>config-repo.zip</code>的归档文件，包含XML配置文件。
        </li>
        <li>
          <strong>版本</strong> - 一个名为<code>version.txt</code>的文本文件，包含备份所在的版本。
        </li>
      </ul>
    </div>;
  }

  private startBackup(vnode: m.Vnode<Attrs>) {
    if (vnode.attrs.backupStatus === BackupStatus.IN_PROGRESS) {
      return;
    }
    vnode.attrs.onPerformBackup();
  }

  private backupConfigHelp(vnode: m.Vnode<Attrs>) {
    return <div class={styles.backupConfigHelp}>
      <p>备份存储于 <strong class={styles.backupLocation}>{vnode.attrs.backupLocation}</strong></p>
      <p>备份配置请查看 <a target="_blank" href={docsUrl("advanced_usage/cron_backup.html")}>备份配置文档</a></p>
    </div>;
  }

  private topLevelError(vnode: m.Vnode<Attrs>) {
    if (vnode.attrs.backupStatus === BackupStatus.ERROR
      && (vnode.attrs.backupProgressStatus === undefined || vnode.attrs.backupProgressStatus < 1)) {
      return <FlashMessage dataTestId="top-level-error" type={MessageType.alert} message={vnode.attrs.message}/>;
    }
  }
}
