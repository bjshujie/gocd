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
import {ButtonGroup, Cancel, Primary} from "views/components/buttons";
import {Form, FormBody} from "views/components/forms/form";
import {TextField} from "views/components/forms/input_fields";
import {ServerManagementAttrs} from "views/pages/server_configuration";
import {OperationState} from "../page_operations";
import styles from "./index.scss";

export class ServerManagementWidget extends MithrilViewComponent<ServerManagementAttrs> {
  private ajaxOperationMonitor = Stream<OperationState>(OperationState.UNKNOWN);

  view(vnode: m.Vnode<ServerManagementAttrs>) {
    const siteUrlsDocsLink      = "installation/configuring_server_details.html#configure-site-urls";
    const siteUrlHelpText       = "服务器将使用此条目生成电子邮件、提要等的链接。格式：[协议]://[主机]:[端口]。";
    const serverSiteUrlHelpText = "如果您希望主站点URL为HTTP，但仍希望为需要SSL的功能提供HTTPS端点，则可以使用基本HTTPS URL的值指定此属性。格式：https://[host]:[port]。";

    const siteUrls = vnode.attrs.siteUrlsVM().entity();
    return <div data-test-id={"server-management-widget"} class={styles.formContainer}>
      <FormBody>
        <div class={styles.formHeader}>
          <h2>配置服务器站点URL</h2>
        </div>
        <div class={styles.formFields}>
          <Form compactForm={true}>
            <TextField label="站点 URL"
                       property={siteUrls.siteUrl}
                       helpText={siteUrlHelpText}
                       docLink={siteUrlsDocsLink}
                       errorText={siteUrls.errors().errorsForDisplay("siteUrl")}/>
            <TextField label="安全站点 URL"
                       property={siteUrls.secureSiteUrl}
                       errorText={siteUrls.errors().errorsForDisplay("secureSiteUrl")}
                       helpText={serverSiteUrlHelpText}
                       docLink={siteUrlsDocsLink}/>
          </Form>
        </div>
        <div class={styles.buttons}>
          <ButtonGroup>
            <Cancel data-test-id={"cancel"} onclick={() => vnode.attrs.onCancel(vnode.attrs.siteUrlsVM())} ajaxOperationMonitor={this.ajaxOperationMonitor}>取消</Cancel>
            <Primary data-test-id={"save"} ajaxOperation={() => vnode.attrs.onServerManagementSave(vnode.attrs.siteUrlsVM().entity(), vnode.attrs.siteUrlsVM().etag())}
                     ajaxOperationMonitor={this.ajaxOperationMonitor}>保存</Primary>
          </ButtonGroup>
        </div>
      </FormBody>
    </div>;
  }
}
