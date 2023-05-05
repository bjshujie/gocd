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
import Stream from "mithril/stream";
import {ButtonGroup, Cancel, Primary, Secondary} from "views/components/buttons";
import {FlashMessage, MessageType} from "views/components/flash_message";
import {Form, FormBody} from "views/components/forms/form";
import {CheckboxField, NumberField, PasswordField, TextField} from "views/components/forms/input_fields";
import {Delete, IconGroup} from "views/components/icons";
import {OperationState} from "views/pages/page_operations";
import {MailServerManagementAttrs} from "views/pages/server_configuration";
import styles from "./index.scss";

const senderEmailHelpText = (
  <span>电子邮件将从此电子邮件地址发送。这将被用作电子邮件的 <code>From:</code> 字段。</span>
);

const portHelpText = (
  <span>指定SMTP服务器的端口号。您的SMTP服务器通常在端口<em>25</em>, <em>465</em> (如果使用SSL) or <em>587</em> (如果使用TLS)上运行。</span>
);

const smtpsHelpText = (
  <span>
    这将更改用于发送邮件的协议。它在<em>SMTP</em>和<em>SMTPS</em>之间切换。
    要为GMail和Office 365等提供商启用<code>STARTLS</code>支持，
  </span>
);

export class MailServerManagementWidget extends MithrilViewComponent<MailServerManagementAttrs> {
  private ajaxOperationMonitor = Stream<OperationState>(OperationState.UNKNOWN);

  view(vnode: m.Vnode<MailServerManagementAttrs>) {
    const mailServer = vnode.attrs.mailServerVM().entity();

    let message, icon;
    if (vnode.attrs.testMailResponse) {
      const msg = vnode.attrs.testMailResponse().hasMessage() ? vnode.attrs.testMailResponse().message : "连接成功";
      message   = <FlashMessage type={vnode.attrs.testMailResponse().type} message={msg}/>;
      switch (vnode.attrs.testMailResponse().type) {
        case MessageType.alert:
          icon = <span class={styles.testConnectionFailure} data-test-id="test-connection-icon-alert"/>;
          break;
        case MessageType.success:
          icon = <span class={styles.testConnectionSuccess} data-test-id="test-connection-icon-success"/>;
          break;
      }
    }

    return <div data-test-id="mail-server-management-widget" class={styles.formContainer}>
      <FormBody>
        <div class={styles.formHeader}>
          <h2>配置您的电子邮件服务器设置</h2>
          <div class={styles.deleteIcon}><IconGroup>
            <Delete data-test-id={"Delete"}
                    disabled={!vnode.attrs.mailServerVM().canDeleteMailServer()}
                    onclick={() => vnode.attrs.onMailServerManagementDelete()}>
              删除</Delete>
          </IconGroup>
          </div>
        </div>
        <div class={styles.formFields}>
          <Form compactForm={true}>
            <TextField
              label="SMTP 主机名"
              errorText={mailServer.errors().errorsForDisplay("hostname")}
              onchange={() => mailServer.validate("hostname")}
              property={mailServer.hostname}
              helpText={"指定SMTP服务器的主机名或ip地址。"}
              required={true}/>

            <NumberField
              label="SMTP 端口"
              errorText={mailServer.errors().errorsForDisplay("port")}
              onchange={() => mailServer.validate("port")}
              property={mailServer.port}
              helpText={portHelpText}
              required={true}/>

            <CheckboxField
              label={"使用 SMTPS"}
              property={mailServer.tls}
              helpText={smtpsHelpText}
              docLink="/configuration/admin_mailhost_info.html#smtps-and-tls"
            />

            <TextField
              label="SMTP 用户名"
              errorText={mailServer.errors().errorsForDisplay("username")}
              onchange={() => mailServer.validate("password")}
              property={mailServer.username}
              helpText={"如果SMTP服务器需要身份验证，请指定用户名。"}/>

            <PasswordField
              label="SMTP 密码"
              errorText={mailServer.errors().errorsForDisplay("password")}
              onchange={() => mailServer.validate("password")}
              property={mailServer.password}
              helpText={"如果SMTP服务器需要身份验证，请指定密码。"}
            />

            <TextField
              label="发送电子邮件使用地址"
              errorText={mailServer.errors().errorsForDisplay("senderEmail")}
              onchange={() => mailServer.validate("senderEmail")}
              property={mailServer.senderEmail}
              required={true}
              helpText={senderEmailHelpText}/>

            <div class={styles.adminMail}>
              <div class={styles.adminMailInput}>
                <TextField
                  label="管理员电子邮件"
                  errorText={mailServer.errors().errorsForDisplay("adminEmail")}
                  onchange={() => mailServer.validate("adminEmail")}
                  property={mailServer.adminEmail}
                  required={true}
                  helpText={"系统管理员的一个或多个电子邮件地址。如果服务器磁盘空间不足或备份失败，将通知此电子邮件。"}/>
              </div>
              <Secondary data-test-id="send-test-email"
                         ajaxOperation={() => vnode.attrs.sendTestMail(vnode.attrs.mailServerVM().entity())}>
                {icon} 发送测试电子邮件
              </Secondary>
            </div>
            {message}
          </Form>
        </div>
        <div class={styles.buttons}>
          <ButtonGroup>
            <Cancel data-test-id={"cancel"}
                    ajaxOperationMonitor={this.ajaxOperationMonitor}
                    onclick={() => vnode.attrs.onCancel(vnode.attrs.mailServerVM())}>取消</Cancel>
            <Primary data-test-id={"save"}
                     ajaxOperationMonitor={this.ajaxOperationMonitor}
                     ajaxOperation={() => vnode.attrs.onMailServerManagementSave(vnode.attrs.mailServerVM().entity())}>保存</Primary>
          </ButtonGroup>
        </div>
      </FormBody>
    </div>;
  }
}
