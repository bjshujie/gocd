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
import {AbstractExtensionType} from "models/shared/plugin_infos_new/extension_type";
import {ExtensionJSON} from "models/shared/plugin_infos_new/serialization";
import {FlashMessage, MessageType} from "views/components/flash_message";
import {Link} from "../link";

interface Attrs<T extends ExtensionJSON> {
  extensionType: AbstractExtensionType<T>;
}

export class NoPluginsOfTypeInstalled<T extends ExtensionJSON> extends MithrilViewComponent<Attrs<T>> {
  view(vnode: m.Vnode<Attrs<T>, this>): m.Children | void | null {
    const message = (
      <div>
          若要使用此页面，您必须确保有一个或
        多个 {vnode.attrs.extensionType.humanReadableName()} 插件被安装. 请查看 <Link
        href={vnode.attrs.extensionType.linkForDocs()} target="_blank" externalLinkIcon={true}>这里</Link> 获取支持的插件列表.
      </div>
    );
    return <FlashMessage type={MessageType.warning} message={message}/>;
  }
}
