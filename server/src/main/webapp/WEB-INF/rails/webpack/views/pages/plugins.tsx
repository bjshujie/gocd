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
import {ApiResult} from "helpers/api_request_builder";
import m from "mithril";
import {PluginInfos} from "models/shared/plugin_infos_new/plugin_info";
import {PluginInfoCRUD} from "models/shared/plugin_infos_new/plugin_info_crud";
import {Link} from "views/components/link";
import {PluginsWidget} from "views/pages/new_plugins/plugins_widget";
import {Page} from "./page";

export class PluginsPage extends Page {

  private pluginInfos?: PluginInfos;

  pageName() {
    return "插件";
  }

  componentToDisplay() {
    if (this.pluginInfos) {
      const isUserAnAdmin = document.body.getAttribute("data-is-user-admin");
      return <PluginsWidget pluginInfos={this.pluginInfos} isUserAnAdmin={isUserAnAdmin === "true"}/>;
    }
  }

  fetchData() {
    return PluginInfoCRUD.all({include_bad: true}).then(this.onSuccess.bind(this));
  }

  helpText(): m.Children {
    return <div>
      插件允许用户扩展凌波的功能。你可以在
      <Link href={docsUrl("extension_points/plugin_user_guide.html")} externalLinkIcon={true}> 这里</Link>
      阅读更多关于他们的信息。
    </div>;
  }

  private onSuccess(pluginInfos: ApiResult<PluginInfos>) {
    pluginInfos.do(
      (successResponse) => this.pluginInfos = successResponse.body,
      () => this.setErrorState()
    );
  }
}
