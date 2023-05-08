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
import {/*apiDocsUrl,*/ docsUrl, GoCDVersion} from "gen/gocd_version";
import {MithrilViewComponent} from "jsx/mithril-component";
import m from "mithril";
import {Link} from "views/components/link";
import styles from "./site_footer.scss";

import {timeFormatter as TimeFormatter} from "helpers/time_formatter";

export interface Attrs {
  maintenanceModeUpdatedOn: string | null;
  maintenanceModeUpdatedBy: string | null;
  isServerInMaintenanceMode: boolean;
  isSupportedBrowser: boolean;
}

export class SiteFooter extends MithrilViewComponent<Attrs> {
  view(vnode: m.Vnode<Attrs>) {
    return <div class={styles.footer}>
      {SiteFooter.maintenanceModeOrLegacyBrowserBanner(vnode)}
      <div class={styles.left}>
        <p class={styles.content}>Copyright &copy; {GoCDVersion.copyrightYear}&nbsp;
          <Link href="https://www.bjshujie.com/products" target="_blank">Beijing Shujie, Inc.</Link>
          &nbsp;
        </p>
      </div>
    </div>;
  }

  private static maintenanceModeOrLegacyBrowserBanner(vnode: m.Vnode<Attrs>) {
    if (vnode.attrs.isServerInMaintenanceMode) {
      const updatedOnLocalTime = TimeFormatter.format(vnode.attrs.maintenanceModeUpdatedOn);

      let updatedByMessage   = `${vnode.attrs.maintenanceModeUpdatedBy} 在 ${updatedOnLocalTime} 开启维护模式`;
      if(vnode.attrs.maintenanceModeUpdatedBy === "GoCD") {
        updatedByMessage   = `GoCD Server is started in maintenance mode at ${updatedOnLocalTime}.`;
      }

      return (<div data-test-id="maintenance-mode-banner" class={styles.footerWarningBanner}>
        {updatedByMessage}
        &nbsp;
        <Link target="_blank" href={docsUrl("/advanced_usage/maintenance_mode.html")}>学习更多..</Link>
      </div>);
    }

    if (!vnode.attrs.isSupportedBrowser) {
      return (<div data-test-id="unsupported-browser-banner" class={styles.footerWarningBanner}>
        You appear to be using an unsupported browser. Please see <a
        href={docsUrl("/installation/system_requirements.html#client-browser-requirements")}
        title="supported browsers"
        target="_blank">this page</a> for a list of supported browsers.
      </div>);
    }
  }
}
