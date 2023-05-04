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
import {AccessToken, AccessTokens, RevokedTokens} from "models/access_tokens/types";
import * as Buttons from "views/components/buttons";
import {Ellipsize} from "views/components/ellipsize";
import {SearchField} from "views/components/forms/input_fields";
import {Tabs} from "views/components/tab";
import {Table} from "views/components/table";
import styles from "views/pages/access_tokens/index.scss";

import {timeFormatter as TimeFormatter} from "helpers/time_formatter";
import {Link} from "views/components/link";

export function getLastUsedInformation(accessToken: AccessToken) {
  const lastUsedAt = accessToken.lastUsedAt();
  if (!lastUsedAt) {
    return "从不";
  }

  return formatTimeInformation(lastUsedAt);
}

export function formatTimeInformation(date: Date) {
  const dateStr = TimeFormatter.format(date);

  if (date.toDateString() === new Date().toDateString()) {
    return `今天 ${dateStr.substr(dateStr.indexOf(" "))}`;
  }

  return dateStr;
}

export function getRevokedBy(revokedBy: string) {
  if (revokedBy === document.body.getAttribute("data-username")) {
    revokedBy = "您";
  }
  return revokedBy;
}

interface Attrs {
  accessTokens: Stream<AccessTokens>;
  onRevoke: (accessToken: Stream<AccessToken>, e: MouseEvent) => void;
}

interface AdminAttrs extends Attrs {
  searchText: Stream<string>;
}

export class AccessTokensWidgetForCurrentUser extends MithrilViewComponent<Attrs> {

  public static helpText() {
    return <ul data-test-id="access-token-info">
      <li>点击“生成令牌”创建新的个人访问令牌.</li>
      <li>生成的令牌可用于访问Rest API.
        <Link href={docsUrl('configuration/access_tokens.html')} externalLinkIcon={true}> 学习更多</Link>
      </li>
    </ul>;
  }

  view(vnode: m.Vnode<Attrs>) {
    const accessTokens = vnode.attrs.accessTokens();
    if (accessTokens.length === 0) {
      return <div class={styles.tips}>
        {AccessTokensWidgetForCurrentUser.helpText()}
      </div>;
    }
    return (
      <div class={styles.personalAccessTokenContainer}>
        <Tabs tabs={["活动令牌·", "已吊销令牌·"]}
              contents={[
                this.getActiveTokensView(vnode),
                this.getRevokedTokensView(vnode)
              ]}/>
      </div>
    );
  }

  getRevokeButton(vnode: m.Vnode<Attrs>, accessToken: Stream<AccessToken>) {
    if (accessToken().revoked()) {
      return <span class={styles.revoked}>吊销</span>;
    }
    return <Buttons.Default data-test-id="button-revoke"
                            onclick={vnode.attrs.onRevoke.bind(this, accessToken)}>吊销</Buttons.Default>;
  }

  private getActiveTokensView(vnode: m.Vnode<Attrs>) {
    const activeTokensData = this.getActiveTokensData(vnode);

    if (activeTokensData.length === 0) {
      return <p>
        You don't have any active tokens.
        Click on 'Generate Token' button to create a new token.
      </p>;
    }

    return <div class={styles.activeTokensTable}>
      <Table headers={["描述", "创建时间", "最近使用时间", "是否被吊销"]}
             data={activeTokensData}/>
    </div>;
  }

  private getRevokedTokensView(vnode: m.Vnode<Attrs>) {
    const revokedTokensData = this.getRevokedTokensData(vnode);

    if (revokedTokensData.length === 0) {
      return <p>您没有任何已吊销令牌·.</p>;
    }

    return <div class={styles.revokedTokensTable}>
      <Table data={revokedTokensData}
             headers={["描述", "创建时间", "最近使用时间", "吊销人", "吊销时间", "吊销信息"]}/>
    </div>;
  }

  private getActiveTokensData(vnode: m.Vnode<Attrs>): m.Child[][] {
    return vnode.attrs.accessTokens().activeTokens().sortByCreateDate().map((accessToken) => {
      return [
        <Ellipsize text={accessToken().description()}/>,
        formatTimeInformation(accessToken().createdAt()),
        getLastUsedInformation(accessToken()),
        this.getRevokeButton(vnode, accessToken)
      ];
    });
  }

  private getRevokedTokensData(vnode: m.Vnode<Attrs>): m.Child[][] {
    return vnode.attrs.accessTokens().revokedTokens().sortByRevokeTime().map((accessToken) => {
      const revokedAt = accessToken().revokedAt();
      return [
        <Ellipsize text={accessToken().description()}/>,
        formatTimeInformation(accessToken().createdAt()),
        getLastUsedInformation(accessToken()),
        getRevokedBy(accessToken().revokedBy()),
        revokedAt ? formatTimeInformation(revokedAt) : null,
        <Ellipsize text={accessToken().revokeCause()!}/>
      ];
    });
  }
}

export class AccessTokensWidgetForAdmin extends MithrilViewComponent<AdminAttrs> {

  public static helpTextWhenNoTokensCreated() {
    return <ul data-test-id="access_token_info">
      <li>Navigate to <a href="/go/access_tokens">个人访问令牌</a>.</li>
      <li>点击 "生成Token" 来创建新的个人访问令牌.</li>
      <li>新创生成的令牌可用于访问系统API.
        <Link href={docsUrl('configuration/access_tokens.html')} externalLinkIcon={true}> 学习更多</Link>
      </li>
    </ul>;
  }

  view(vnode: m.Vnode<AdminAttrs>) {
    const accessTokens = vnode.attrs.accessTokens();
    if (accessTokens.length === 0) {
      return <div class={styles.tips}>
        {AccessTokensWidgetForAdmin.helpTextWhenNoTokensCreated()}
      </div>;
    }

    return (
      <div class={styles.adminAccessTokenContainer}>
        <div class={styles.accessTokenSearchBox}>
          <SearchField property={vnode.attrs.searchText} dataTestId={"search-box"} placeholder={"Search tokens"}/>
        </div>
        <Tabs
          tabs={["激活的令牌", "已吊销停牌"]}
          contents={[
            this.getActiveTokensView(accessTokens.activeTokens(), vnode.attrs.onRevoke, vnode.attrs.searchText()),
            this.getRevokedTokensView(accessTokens.revokedTokens(), vnode.attrs.searchText())
          ]}
        />
      </div>
    );
  }

  getRevokeButton(accessToken: Stream<AccessToken>,
                  onRevoke: (accessToken: Stream<AccessToken>, e: MouseEvent) => void) {
    if (accessToken().revoked()) {
      return <span class={styles.revoked}>吊销</span>;
    }
    return <Buttons.Default data-test-id="button-revoke"
                            onclick={onRevoke.bind(this, accessToken)}>吊销</Buttons.Default>;
  }

  private filterBySearchText(accessTokens: AccessTokens, searchText?: string) {
    if (searchText) {
      return accessTokens.filterBySearchText(searchText);
    }
    return accessTokens;
  }

  private getActiveTokensView(allActiveTokens: AccessTokens,
                              onRevoke: (accessToken: Stream<AccessToken>, e: MouseEvent) => void,
                              searchText?: string) {
    if (allActiveTokens.length === 0) {
      return <p>There are no active tokens.</p>;
    }

    const accessTokenDataPostFilter = this.getActiveTokensData(allActiveTokens, onRevoke, searchText);
    if (accessTokenDataPostFilter.length === 0) {
      return <p>无匹配您的查询激活的令牌.</p>;
    }

    return <div class={styles.activeTokensTable}>
      <Table headers={["创建人", "描述", "创建时间", "最后使用时间", "是否已吊销"]}
             data={accessTokenDataPostFilter}/></div>;
  }

  private getRevokedTokensView(allRevokedTokens: RevokedTokens, searchText?: string) {
    if (allRevokedTokens.length === 0) {
      return <p>无已吊销令牌·.</p>;
    }

    const revokedTokensData = this.getRevokedTokensData(allRevokedTokens, searchText);

    if (revokedTokensData.length === 0) {
      return <p>无匹配您的查询吊销的令牌.</p>;
    }

    return <div class={styles.revokedTokensTable}>
      <Table data={revokedTokensData}
             headers={["创建人", "描述", "创建时间", "最后使用时间", "吊销人", "吊销时间", "吊销信息"]}/>
    </div>;
  }

  private getActiveTokensData(accessTokens: AccessTokens,
                              onRevoke: (accessToken: Stream<AccessToken>, e: MouseEvent) => void,
                              searchText?: string) {
    return this.filterBySearchText(accessTokens, searchText)
               .sortByCreateDate()
               .map((accessToken) => {
                 return [
                   accessToken().username(),
                   <Ellipsize text={accessToken().description()}/>,
                   formatTimeInformation(accessToken().createdAt()),
                   getLastUsedInformation(accessToken()),
                   this.getRevokeButton(accessToken, onRevoke)
                 ];
               });
  }

  private getRevokedTokensData(revokedTokens: RevokedTokens, searchText?: string) {
    return this.filterBySearchText(revokedTokens.sortByRevokeTime(), searchText)
               .map((accessToken) => {
                 const revokedAt = accessToken().revokedAt();
                 return [
                   accessToken().username(),
                   <Ellipsize text={accessToken().description()}/>,
                   formatTimeInformation(accessToken().createdAt()),
                   getLastUsedInformation(accessToken()),
                   getRevokedBy(accessToken().revokedBy()),
                   revokedAt ? formatTimeInformation(revokedAt) : null,
                   <Ellipsize text={accessToken().revokeCause()!}/>
                 ];
               });
  }
}
