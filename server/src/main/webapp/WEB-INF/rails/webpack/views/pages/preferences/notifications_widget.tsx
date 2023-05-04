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
import s from "underscore.string";
import {ButtonIcon, Primary} from "views/components/buttons";
import {Delete, Edit, IconGroup} from "views/components/icons";
import {Link} from "views/components/link";
import {Table} from "views/components/table";
import {NotificationsAttrs, SMTPAttrs} from "views/pages/new_preferences";
import styles from "./index.scss";

type Attrs = NotificationsAttrs & SMTPAttrs;

export class NotificationsWidget extends MithrilViewComponent<Attrs> {

  view(vnode: m.Vnode<Attrs, this>) {
    let msgOrFilters;
    if (vnode.attrs.notificationVMs().entity().length === 0) {
      msgOrFilters = <div className={styles.tips} data-test-id="notification-filters-info">
        <ul>
          <li>点击 "增加通知过滤器" 来增加一个新的Email通知筛选器.</li>
          <li>只有在启用了安全性并且邮件主机信息正确的情况下，通知才会起作用。 你可以在 <Link target="_blank" href={docsUrl("configuration/dev_notifications.html")}>这里</Link>阅读更多.
          </li>
        </ul>
      </div>;
    } else {
      msgOrFilters = <Table headers={['Pipeline', 'Stage', 'Event', 'Check-ins Matcher', '']}
                            data={this.getTableData(vnode)}/>;
    }
    return <div data-test-id="notifications-widget" class={styles.notificationWrapper}>
      <div className={styles.formHeader}>
        <h3>当前通知筛选器</h3>
        <div className={styles.formButton}>
          <Primary icon={ButtonIcon.ADD}
                   disabled={!vnode.attrs.isSMTPConfigured}
                   title={this.getTitle(vnode.attrs.isSMTPConfigured, 'add')}
                   dataTestId={"notification-filter-add"}
                   onclick={vnode.attrs.onAddFilter.bind(this)}>增加通知筛选器</Primary>
        </div>
      </div>
      {msgOrFilters}
    </div>;
  }

  private getTableData(vnode: m.Vnode<Attrs, this>) {
    return vnode.attrs.notificationVMs().entity().map(
      (filter) => {
        return [
          filter.pipeline(),
          filter.stage(),
          filter.event().toString(),
          filter.matchCommits() ? 'Mine' : 'All',
          <IconGroup>
            <Edit data-test-id="notification-filter-edit"
                  disabled={!vnode.attrs.isSMTPConfigured}
                  title={this.getTitle(vnode.attrs.isSMTPConfigured, 'edit')}
                  onclick={vnode.attrs.onEditFilter.bind(this, filter)}/>
            <Delete data-test-id="notification-filter-delete"
                    title={'Delete notification filter'}
                    onclick={vnode.attrs.onDeleteFilter.bind(this, filter)}/>
          </IconGroup>
        ];
      }
    );
  }

  private getTitle(isSMTPConfigured: boolean, action: 'add' | 'edit') {
    if (isSMTPConfigured) {
      return `${s.capitalize(action)} 通知筛选器`;
    }
    return `无法 ${action} 通知筛选器，因为尚未配置SMTP`;
  }
}
