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
import {AuthPluginInfo} from "models/authentication/auth_plugin_info";
import styles from "views/pages/login_page/login_page_widget.scss";

const LOGIN_PAGE_URL = "/go/auth/login";
const loggedOut      = require("./icon_loggedout.svg");

export class LogoutPageWidget extends MithrilViewComponent<AuthPluginInfo> {

  oninit(vnode: m.Vnode<AuthPluginInfo, this>): any {
    if (!vnode.attrs.doNotAutoRedirect && LogoutPageWidget.shouldRedirect(vnode)) {
      window.setTimeout(() => {
        window.location.href = LOGIN_PAGE_URL;
      }, 5000);
    }
  }

  view(vnode: m.Vnode<AuthPluginInfo, this>): m.Children | void | null {
    if (LogoutPageWidget.shouldRedirect(vnode)) {
      return LogoutPageWidget.redirectMessage();
    }
    return (
      <div class={styles.loggedOut}>
        <div class={styles.logoutGraphics}>
          <img src={loggedOut}/>
        </div>
        <p>您已退出. <a href={LOGIN_PAGE_URL}>点进这里</a> 重新登录.</p>
      </div>
    );
  }

  private static redirectMessage() {
    return (
      <div class={styles.loggedOut}>
        <div class={styles.logoutGraphics}>
          <img src={loggedOut}/>
        </div>
        <p>
          您已退出.
          您将在几秒种内自动被重定向到 <a href={LOGIN_PAGE_URL}>登录页</a>
        </p>
      </div>
    );
  }

  private static shouldRedirect(vnode: m.Vnode<AuthPluginInfo, LogoutPageWidget>) {
    return vnode.attrs.hasPasswordPlugins || (vnode.attrs.hasWebBasedPlugins && vnode.attrs.webBasedPlugins.length !== 1);
  }
}
