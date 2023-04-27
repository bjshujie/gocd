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
import {PipelineGroup, PipelineGroups, PipelineWithOrigin} from "models/internal_pipeline_structure/pipeline_structure";
import s from "underscore.string";
import {Anchor, ScrollManager} from "views/components/anchor/anchor";
import {ButtonIcon, Primary} from "views/components/buttons";
import {FlashMessage, MessageType} from "views/components/flash_message";
import {ChevronRightCircle, Clone, Delete, Download, Edit, IconGroup, Plus} from "views/components/icons";
import {Link} from "views/components/link";
import {SaveOperation} from "views/pages/page_operations";
import styles from "./admin_pipelines_widget.scss";

interface Operations extends SaveOperation {
  doClonePipeline: (pipeline: PipelineWithOrigin) => void;
  doMovePipeline: (sourceGroup: PipelineGroup, pipeline: PipelineWithOrigin) => void;
  doEditPipeline: (pipeline: PipelineWithOrigin) => void;
  doDownloadPipeline: (pipeline: PipelineWithOrigin) => void;
  doDeletePipeline: (pipeline: PipelineWithOrigin) => void;
  doExtractPipeline: (pipeline: PipelineWithOrigin) => void;
  doEditPipelineGroup: (groupName: string) => void;
  doDeleteGroup: (group: PipelineGroup) => void;
  createPipelineInGroup: (groupName: string) => void;
}

interface PipelineGroupAttrs extends Operations {
  group: PipelineGroup;
  scrollOptions: PipelinesScrollOptions;
  canMovePipeline: boolean;
}

export interface PipelinesScrollOptions {
  sm: ScrollManager;
  shouldOpenEditView: boolean;
}

export interface Attrs extends Operations {
  pipelineGroups: Stream<PipelineGroups>;
  createPipelineGroup: () => void;
  scrollOptions: PipelinesScrollOptions;
}

type PipelineWidgetAttrs = PipelineGroupAttrs & { pipeline: PipelineWithOrigin; };

class PipelineWidget extends MithrilViewComponent<PipelineWidgetAttrs> {
  view(vnode: m.Vnode<PipelineWidgetAttrs, this>) {
    return (
      <div data-test-id={`pipeline-${s.slugify(vnode.attrs.pipeline.name())}`} class={styles.pipelineRow}>
        <div data-test-id={`pipeline-name-${s.slugify(vnode.attrs.pipeline.name())}`}
             class={styles.pipelineName}>{vnode.attrs.pipeline.name()}</div>
        <div class={styles.pipelineActionButtons}>{this.actions(vnode, vnode.attrs.pipeline)}</div>
      </div>
    );
  }

  private static messageForOperation(pipeline: PipelineWithOrigin,
                                     operation: "move" | "clone" | "edit" | "delete" | "extract template from") {
    if (operation === "extract template from" && pipeline.usesTemplate()) {
      return `无法 ${operation} 算法 '${pipeline.name()}' 因为它在使用模板.`;
    }
    if (operation === "delete") {
      if (pipeline.isDefinedRemotely()) {
        return `无法删除算法 '${pipeline.name()}' 因为它在配置仓库中有定义 '${pipeline.origin().id()}'.`;
      }
      if (pipeline.environment() !== undefined && pipeline.environment() !== null) {
        return `无法删除算法 '${pipeline.name()}' 因为它存在于环境 '${pipeline.environment()}'中.`;
      }
      if (pipeline.dependantPipelines() !== undefined && pipeline.dependantPipelines()!.length > 0) {
        const dependentPipelineNames = pipeline.dependantPipelines().map(d => d.dependent_pipeline_name);
        return `无法删除算法 '${pipeline.name()}' 因为算法 '${dependentPipelineNames}' 依赖于它.`;
      }
    }

    return `${s.capitalize(operation)} 算法 '${pipeline.name()}'`;
  }

  private static messageForMove(pipeline: PipelineWithOrigin, canMovePipeline: boolean) {
    if (pipeline.origin().isDefinedInConfigRepo()) {
      return `无法移动算法 '${pipeline.name()}' 因为它在配置仓库中有定义 '${pipeline.origin().id()}'.`;
    }
    if (!canMovePipeline) {
      return `无法移动算法 '${pipeline.name()}' 因为没有其它的算法组.`;
    }
    return `移动算法 '${pipeline.name()}'`;
  }

  private actions(vnode: m.Vnode<PipelineWidgetAttrs, this>, eachPipeline: PipelineWithOrigin) {
    const titleForMove = PipelineWidget.messageForMove(eachPipeline, vnode.attrs.canMovePipeline);
    return (
      <IconGroup>
        <Edit
          data-test-id={`edit-pipeline-${s.slugify(eachPipeline.name())}`}
          title={PipelineWidget.messageForOperation(eachPipeline, "edit")}
          onclick={vnode.attrs.doEditPipeline.bind(vnode.attrs, eachPipeline)}/>
        <ChevronRightCircle
          disabled={eachPipeline.origin().isDefinedInConfigRepo() || !vnode.attrs.canMovePipeline}
          data-test-id={`move-pipeline-${s.slugify(eachPipeline.name())}`}
          title={titleForMove}
          onclick={vnode.attrs.doMovePipeline.bind(vnode.attrs, vnode.attrs.group, eachPipeline)}/>
        <Download
          data-test-id={`download-pipeline-${s.slugify(eachPipeline.name())}`}
          title={`Download pipeline configuration for '${eachPipeline.name()}'`}
          onclick={vnode.attrs.doDownloadPipeline.bind(vnode.attrs, eachPipeline)}/>
        <Clone
          disabled={eachPipeline.origin().isDefinedInConfigRepo()}
          data-test-id={`clone-pipeline-${s.slugify(eachPipeline.name())}`}
          title={PipelineWidget.messageForOperation(eachPipeline, "clone")}
          onclick={vnode.attrs.doClonePipeline.bind(vnode.attrs, eachPipeline)}/>
        <Delete
          disabled={!eachPipeline.canBeDeleted()}
          data-test-id={`delete-pipeline-${eachPipeline.name()}`}
          title={PipelineWidget.messageForOperation(eachPipeline, "delete")}
          onclick={vnode.attrs.doDeletePipeline.bind(vnode.attrs, eachPipeline)}/>
        <Plus
          disabled={eachPipeline.origin().isDefinedInConfigRepo() || eachPipeline.usesTemplate()}
          data-test-id={`extract-template-from-pipeline-${eachPipeline.name()}`}
          title={PipelineWidget.messageForOperation(eachPipeline, "extract template from")}
          onclick={vnode.attrs.doExtractPipeline.bind(vnode.attrs, eachPipeline)}/>
      </IconGroup>
    );
  }
}

class PipelineGroupWidget extends MithrilViewComponent<PipelineGroupAttrs> {
  view(vnode: m.Vnode<PipelineGroupAttrs, this>) {
    const grpName    = vnode.attrs.group.name();
    const onNavigate = () => {
      if (vnode.attrs.scrollOptions.sm.getTarget() === grpName && vnode.attrs.scrollOptions.shouldOpenEditView) {
        vnode.attrs.doEditPipelineGroup(grpName);
      }
    };
    return (<Anchor id={grpName} sm={vnode.attrs.scrollOptions.sm} onnavigate={onNavigate}>
        <div data-test-id={`pipeline-group-${s.slugify(grpName)}`}
             class={styles.pipelineGroupRow}>
          <div data-test-id={`pipeline-group-name-${s.slugify(grpName)}`}
               class={styles.pipelineGroupName}>
            <span>算法组:</span>
            <span data-test-id="pipeline-group-name" class={styles.value}>{grpName}</span>
          </div>
          <div class={styles.pipelineGroupActionButtons}>{this.actions(vnode)}</div>
          {this.showPipelines(vnode)}
        </div>
      </Anchor>
    );
  }

  private showPipelines(vnode: m.Vnode<PipelineGroupAttrs, this>) {
    if (vnode.attrs.group.hasPipelines()) {
      return vnode.attrs.group.pipelines().map((eachPipeline) => {
        return <PipelineWidget pipeline={eachPipeline} {...vnode.attrs}/>;
      });
    } else {
      return (
        <div class={styles.noPipelinesDefinedMessage}>
          <FlashMessage message="此算法组中未定义任何算法." type={MessageType.info}/>
        </div>
      );
    }
  }

  private actions(vnode: m.Vnode<PipelineGroupAttrs, this>) {
    return (
      <div>
        <Primary icon={ButtonIcon.ADD}
                 dataTestId={`create-pipeline-in-group-${s.slugify(vnode.attrs.group.name())}`}
                 onclick={vnode.attrs.createPipelineInGroup.bind(vnode.attrs, vnode.attrs.group.name())}>
          创建一个新算法
        </Primary>
        <span class={styles.iconGroupWrapper}>
          <IconGroup>
            <Edit
              data-test-id={`edit-pipeline-group-${s.slugify(vnode.attrs.group.name())}`}
              onclick={() => vnode.attrs.doEditPipelineGroup(vnode.attrs.group.name())}/>
            <Delete disabled={vnode.attrs.group.hasPipelines()}
                    data-test-id={`delete-pipeline-group-${s.slugify(vnode.attrs.group.name())}`}
                    title="要删除算法组，请先移除或删除该组中的所有算法"
                    onclick={vnode.attrs.doDeleteGroup.bind(vnode.attrs, vnode.attrs.group)}/>
          </IconGroup>
        </span>
      </div>
    );
  }
}

export class PipelineGroupsWidget extends MithrilViewComponent<Attrs> {

  public static helpTextWhenEmpty() {
    return <ul data-test-id="pipelines-help-text">
      <li>仅系统管理员允许创建算法组.
        <Link href={docsUrl("configuration/pipelines.html")} externalLinkIcon={true}> 学习更多</Link>
      </li>
      <li>管理员可授权用户和角色管理算法组.
        <Link href={docsUrl("configuration/delegating_group_administration.html")} externalLinkIcon={true}> 学习更多</Link>
      </li>
    </ul>;
  }

  view(vnode: m.Vnode<Attrs>) {
    if (vnode.attrs.scrollOptions.sm.hasTarget()) {
      const target    = vnode.attrs.scrollOptions.sm.getTarget();
      const hasTarget = vnode.attrs.pipelineGroups().some((grp) => grp.name() === target);
      if (!hasTarget) {
        const pipelineUrl = "configuration/pipeline_group_admin_config.html";
        const docLink     = <span data-test-id="doc-link">
       <Link href={docsUrl(pipelineUrl)} target="_blank" externalLinkIcon={true}>
        Learn More
      </Link>
    </span>;
        const msg         = `编辑 '${target}' 尚未设置算法组，或者您无权查看该算法组.`;
        return <FlashMessage dataTestId="anchor-pipeline-grp-not-present" type={MessageType.alert}>
          {msg} {docLink}
        </FlashMessage>;
      }
    }
    if (_.isEmpty(vnode.attrs.pipelineGroups())) {
      const pipelineUrl = "configuration/pipelines.html";
      const docLink     = <span data-test-id="doc-link">
       <Link href={docsUrl(pipelineUrl)} target="_blank" externalLinkIcon={true}>
        Learn More
      </Link>
    </span>;
      return [
        <FlashMessage type={MessageType.info}>
          要么没有定义算法，要么您无权查看相同的算法. {docLink}
        </FlashMessage>,
        <div className={styles.tips}>
          {PipelineGroupsWidget.helpTextWhenEmpty()}
        </div>
      ];
    }
    const canMovePipeline = vnode.attrs.pipelineGroups().length > 1;
    return (
      <div data-test-id="pipeline-groups">
        {vnode.attrs.pipelineGroups().map((group) => {
          return <PipelineGroupWidget canMovePipeline={canMovePipeline} group={group} {...vnode.attrs} />;
        })}
      </div>
    );
  }
}
