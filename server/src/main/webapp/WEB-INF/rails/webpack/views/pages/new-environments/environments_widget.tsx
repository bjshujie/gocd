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
import _ from "lodash";
import m from "mithril";
import Stream from "mithril/stream";
import {Agents} from "models/agents/agents";
import {Environments, EnvironmentWithOrigin} from "models/new-environments/environments";
import {Anchor, ScrollManager} from "views/components/anchor/anchor";
import {CollapsiblePanel} from "views/components/collapsible_panel";
import {FlashMessage, MessageType} from "views/components/flash_message";
import {Delete, IconGroup} from "views/components/icons";
import {Link} from "views/components/link";
import {EnvironmentBody} from "views/pages/new-environments/environment_body_widget";
import {EnvironmentHeader} from "views/pages/new-environments/environment_header_widget";
import {DeleteOperation} from "views/pages/page_operations";
import styles from "./index.scss";

interface Attrs extends DeleteOperation<EnvironmentWithOrigin> {
  environments: Stream<Environments>;
  onSuccessfulSave: (msg: m.Children) => void;
  agents: Stream<Agents>;
  sm: ScrollManager;
}

interface EnvAttrs extends Attrs {
  environment: EnvironmentWithOrigin;
}

export class EnvironmentWidget extends MithrilViewComponent<EnvAttrs> {
  expanded: Stream<boolean> = Stream();

  oninit(vnode: m.Vnode<EnvAttrs>) {
    const linked = vnode.attrs.sm.getTarget() === vnode.attrs.environment.name();

    // set the initial state of the collapsible panel; alternative to setting `expanded` attribute
    // and, perhaps, more obvious that this is only matters for first load
    this.expanded(linked);
  }

  view(vnode: m.Vnode<EnvAttrs>) {
    const environment = vnode.attrs.environment;
    return <Anchor id={environment.name()} sm={vnode.attrs.sm} onnavigate={() => this.expanded(true)}>
      <CollapsiblePanel header={<EnvironmentHeader environment={environment} agents={vnode.attrs.agents}/>}
                        warning={this.isEnvEmpty(environment)}
                        actions={this.getActionButtons(environment, vnode)}
                        dataTestId={`collapsible-panel-for-env-${environment.name()}`}
                        vm={this}>
        <EnvironmentBody environment={environment}
                         environments={vnode.attrs.environments}
                         agents={vnode.attrs.agents}
                         onSuccessfulSave={vnode.attrs.onSuccessfulSave}/>
      </CollapsiblePanel>
    </Anchor>;
  }

  getActionButtons(environment: EnvironmentWithOrigin, vnode: m.Vnode<EnvAttrs>) {
    let warningButton;
    if (this.isEnvEmpty(environment)) {
      warningButton = <div data-test-id="warning-tooltip-wrapper" className={styles.warningTooltipWrapper}>
        <i data-test-id={"warning-icon"} className={styles.warningIcon}/>
        <div data-test-id="warning-tooltip-content" className={styles.warningTooltipContent}>
          <p>算法和节点都与此环境无关联.</p>
        </div>
      </div>;
    }
    let deleteTitle;
    if (!environment.canAdminister()) {
      deleteTitle = `You are not authorized to delete the '${environment.name()}' environment.`;
    } else if (!environment.isLocal()) {
      deleteTitle = `无法删除环境 '${environment.name()}' ，因为它部分定义在配置存储库中.`;
    }
    return [
      warningButton,
      <IconGroup>
        <Delete
          title={deleteTitle}
          disabled={!environment.canAdminister() || !environment.isLocal()}
          onclick={vnode.attrs.onDelete.bind(vnode.attrs, environment)}/>
      </IconGroup>
    ];
  }

  private isEnvEmpty(environment: EnvironmentWithOrigin) {
    return _.isEmpty(environment.pipelines()) && _.isEmpty(environment.agents());

  }
}

export class EnvironmentsWidget extends MithrilViewComponent<Attrs> {
  public static helpText(){
    return <ul>
      <li>单击“添加环境”以添加新环境.</li>
      <li>环境是一组算法和节点.</li>
      <li>通过将节点分配给环境，它将仅用于运行属于该环境算法的作业.</li>
      <li>一个节点可以属于多个环境。但是，算法只能分配给单个环境.
        <Link href={docsUrl('configuration/managing_environments.html')} externalLinkIcon={true}> 学习更多</Link>
      </li>
    </ul> ;
  }
  view(vnode: m.Vnode<Attrs>) {
    const manager = vnode.attrs.sm;
    if (manager.hasTarget()) {
      const target           = manager.getTarget();
      const hasAnchorElement = vnode.attrs.environments().some((env) => env.name() === target);
      if (!hasAnchorElement) {
        const msg = `环境 '${target}'环境尚未设置，或者您无权查看该环境.`;
        return <FlashMessage dataTestId="anchor-env-not-present" type={MessageType.alert} message={msg}/>;
      }
    }

    if (_.isEmpty(vnode.attrs.environments())) {
      return this.noEnvironmentConfiguresMessage();
    }

    return <div>
      {vnode.attrs.environments().map((environment: any) => {
        return <EnvironmentWidget {...vnode.attrs} environment={environment}/>;
      })}
    </div>;

  }

  noEnvironmentConfiguresMessage() {
    const environmentUrl = "/configuration/managing_environments.html";
    const docLink        = <span data-test-id="doc-link">
       <Link href={docsUrl(environmentUrl)} target="_blank" externalLinkIcon={true}>
        学习更多
      </Link>
    </span>;

    const noEnvironmentPresentMsg = <span>
      要么没有设置任何环境，要么您无权查看这些环境. {docLink}
    </span>;

    return [
      <FlashMessage type={MessageType.info} message={noEnvironmentPresentMsg}
                    dataTestId="no-environment-present-msg"/>,
      <div className={styles.tips}>
        {EnvironmentsWidget.helpText()}
      </div>
    ];
  }
}
