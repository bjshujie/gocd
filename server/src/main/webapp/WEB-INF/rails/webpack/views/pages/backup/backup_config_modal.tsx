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
import Stream from "mithril/stream";
import {BackupConfig} from "models/backup_config/types";
import {ButtonIcon, Cancel, Primary} from "views/components/buttons";
import {FlashMessage, MessageType} from "views/components/flash_message";
import {Form, FormBody} from "views/components/forms/form";
import {CheckboxField, TextField} from "views/components/forms/input_fields";
import {Modal, Size} from "views/components/modal";

export interface Attrs {
  backupConfig: Stream<BackupConfig>;
}

const backupScheduleHelpText = (
  <span>
    用于执行备份的类似Quartz cron的规范。请参阅 <a
    href="https://www.quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/crontrigger.html"
    target="_blank"
    rel="noopener noreferrer">quartz 文档</a> 以查阅语法和 <a
    href="https://www.quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/crontrigger.html#examples"
    target="_blank"
    rel="noopener noreferrer">一些例子</a>。
  </span>
);

const backupScriptHelpText = (
  <span>
    备份完成后，将调用该脚本，允许您将备份文件复制到其它的机器或服务。
    查看 <a href={docsUrl("/advanced_usage/cron_backup.html")} target="_blank"
               rel="noopener noreferrer">help documentation</a> 以获得更多信息。
  </span>
);

class BackupConfigWidget extends MithrilViewComponent<Attrs> {
  view(vnode: m.Vnode<Attrs>) {
    return (
      <div>
        <h1>
          备份配置
        </h1>

        <FormBody>
          <Form>
            <TextField label="备份计划"
                       helpText={backupScheduleHelpText}
                       property={vnode.attrs.backupConfig().schedule}
                       errorText={vnode.attrs.backupConfig().errors().errorsForDisplay("schedule")}/>

            <TextField label="备份后执行脚本"
                       property={vnode.attrs.backupConfig().postBackupScript}
                       helpText={backupScriptHelpText}
                       errorText={vnode.attrs.backupConfig().errors().errorsForDisplay("postBackupScript")}/>

            <CheckboxField label="备份失败发送邮件"
                           property={vnode.attrs.backupConfig().emailOnFailure}
                           helpText="如果勾选，当备份失败后会发送一封邮件，无论什么原因."/>

            <CheckboxField label="备份成功发送邮件"
                           property={vnode.attrs.backupConfig().emailOnSuccess}
                           helpText="如果勾选，当备份成功后会发送一封邮件."/>
          </Form>
        </FormBody>
      </div>
    );
  }
}

type MouseEventHandler = (modal: BackupConfigModal) => void;

export class BackupConfigModal extends Modal {
  private readonly backupConfig: Stream<BackupConfig>;
  private readonly showSpinner: Stream<boolean>;

  private readonly errorMessage: Stream<string>;
  private readonly isSaving: Stream<boolean>;
  private onsave: MouseEventHandler;

  constructor(backupConfig: Stream<BackupConfig>,
              showSpinner: Stream<boolean>,
              errorMessage: Stream<string>,
              isSaving: Stream<boolean>,
              onsave: MouseEventHandler) {
    super(Size.medium);
    this.backupConfig = backupConfig;
    this.showSpinner  = showSpinner;
    this.errorMessage = errorMessage;
    this.isSaving     = isSaving;
    this.onsave       = onsave;
  }

  title(): string {
    return "配置备份设置";
  }

  body() {
    return [
      <FlashMessage message={this.errorMessage()} type={MessageType.alert}/>,
      [<BackupConfigWidget backupConfig={this.backupConfig} key={"backup config"}/>]
    ];
  }

  buttons() {
    if (this.isLoading()) {
      return [<Primary data-test-id="button-ok" onclick={this.close.bind(this)}>取消</Primary>];
    } else if (this.errorMessage()) {
      return [<Primary data-test-id="button-ok" onclick={this.close.bind(this)}>关闭</Primary>];
    } else {
      return [
        <Primary data-test-id="button-ok" icon={this.isSaving() ? ButtonIcon.SPINNER : undefined}
                 onclick={this.onsave.bind(this, this)}>保存</Primary>,
        <Cancel data-test-id="button-ok" onclick={this.close.bind(this)}>取消</Cancel>
      ];
    }
  }

  protected isLoading(): boolean {
    return this.showSpinner();
  }

}
