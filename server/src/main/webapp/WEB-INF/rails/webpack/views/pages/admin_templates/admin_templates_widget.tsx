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
import {TemplateSummary} from "models/admin_templates/templates";
import {headerMeta} from "models/current_user_permissions";
import {PipelineStructure, PipelineWithOrigin} from "models/internal_pipeline_structure/pipeline_structure";
import s from "underscore.string";
import {Anchor, ScrollManager} from "views/components/anchor/anchor";
import {FlashMessage, MessageType} from "views/components/flash_message";
import {Delete, Edit, IconGroup, Lock, View} from "views/components/icons";
import {Link} from "views/components/link";
import styles from "views/pages/admin_pipelines/admin_pipelines_widget.scss";
import {CreateOperation, DeleteOperation, EditOperation, SaveOperation} from "views/pages/page_operations";

interface Operations extends SaveOperation, EditOperation<TemplateSummary.TemplateSummaryTemplate>, DeleteOperation<TemplateSummary.TemplateSummaryTemplate>, CreateOperation<TemplateSummary.TemplateSummaryTemplate> {
  doEditPipeline: (pipelineName: string) => void;
  editPermissions: (template: TemplateSummary.TemplateSummaryTemplate) => void;
}

export interface TemplatesScrollOptions {
  sm: ScrollManager;
  shouldOpenReadOnlyView: boolean;
}

interface TemplateAttrs extends Operations {
  doShowTemplate: (templateName: string) => void;
  template: TemplateSummary.TemplateSummaryTemplate;
  pipelineStructure: PipelineStructure;
  scrollOptions: TemplatesScrollOptions;
}

export interface Attrs extends Operations {
  doShowTemplate: (templateName: string) => void;
  templates: TemplateSummary.TemplateSummaryTemplate[];
  pipelineStructure: PipelineStructure;
  scrollOptions: TemplatesScrollOptions;
}

interface PipelineWidgetAttrs {
  template: TemplateSummary.TemplateSummaryTemplate;
  pipeline: TemplateSummary.TemplateSummaryPipeline;
  pipelineStructure: PipelineStructure;
  doEditPipeline: (pipelineName: string) => void;
}

class PipelineWidget extends MithrilViewComponent<PipelineWidgetAttrs> {
  view(vnode: m.Vnode<PipelineWidgetAttrs, this>) {
    return (
      <div data-test-id={`pipeline-${s.slugify(vnode.attrs.pipeline.name)}`} class={styles.pipelineRow}>
        <div data-test-id={`pipeline-name-${s.slugify(vnode.attrs.pipeline.name)}`}
             class={styles.pipelineName}>{vnode.attrs.pipeline.name}</div>
        <div class={styles.pipelineActionButtons}>{this.actions(vnode)}</div>
      </div>
    );
  }

  private static messageForOperation(pipeline: PipelineWithOrigin | undefined,
                                     pipelineWithPermission: TemplateSummary.TemplateSummaryPipeline,
                                     operation: "edit") {
    if (!pipelineWithPermission.can_administer) {
      return `Cannot ${operation} pipeline '${pipelineWithPermission.name}' because you do do not have permission to edit it.`;
    } else {
      return `${s.capitalize(operation)} pipeline '${pipelineWithPermission.name}'`;
    }
  }

  private actions(vnode: m.Vnode<PipelineWidgetAttrs, this>) {
    const pipeline = vnode.attrs.pipelineStructure.findPipeline(vnode.attrs.pipeline.name);

    return (
      <IconGroup>
        <Edit
          disabled={!(vnode.attrs.pipeline.can_administer)}
          data-test-id={`edit-pipeline-${s.slugify(vnode.attrs.pipeline.name)}`}
          title={PipelineWidget.messageForOperation(pipeline, vnode.attrs.pipeline, "edit")}
          onclick={vnode.attrs.doEditPipeline.bind(vnode.attrs, vnode.attrs.pipeline.name)}/>
      </IconGroup>
    );
  }
}

class TemplateWidget extends MithrilViewComponent<TemplateAttrs> {
  view(vnode: m.Vnode<TemplateAttrs, this>) {
    return (<Anchor id={vnode.attrs.template.name}
                    sm={vnode.attrs.scrollOptions.sm}
                    onnavigate={() => {
                      if (vnode.attrs.scrollOptions.shouldOpenReadOnlyView) {
                        vnode.attrs.doShowTemplate.bind(vnode.attrs, vnode.attrs.template.name)();
                      }
                    }}>
        <div data-test-id={`template-${s.slugify(vnode.attrs.template.name)}`}
             class={styles.pipelineGroupRow}>
          <div data-test-id={`template-name-${s.slugify(vnode.attrs.template.name)}`}
               class={styles.pipelineGroupName}>
            <span>模板:</span>
            <span class={styles.value}>{vnode.attrs.template.name}</span>
          </div>
          <div class={styles.pipelineGroupActionButtons}>{this.actions(vnode)}</div>
          {this.showPipelinesAssociatedWith(vnode)}
        </div>
      </Anchor>
    );
  }

  private showPipelinesAssociatedWith(vnode: m.Vnode<TemplateAttrs, this>) {
    const pipelines = vnode.attrs.template._embedded.pipelines;
    if (!_.isEmpty(pipelines)) {
      return pipelines.map((eachPipeline) => {
        return <PipelineWidget pipeline={eachPipeline} {...vnode.attrs}/>;
      });
    } else {
      return (
        <div class={styles.noPipelinesDefinedMessage}>
          <FlashMessage message="没有与此模板关联的算法." type={MessageType.info}/>
        </div>
      );
    }
  }

  private actions(vnode: m.Vnode<TemplateAttrs, this>) {
    const template     = vnode.attrs.template;
    const templateName = template.name;
    return (
      <div>
        <span class={styles.iconGroupWrapper}>
          <IconGroup>
            <View
              title={`查看模板`}
              data-test-id={`edit-template-permissions-${s.slugify(templateName)}`}
              onclick={vnode.attrs.doShowTemplate.bind(vnode.attrs, templateName)}/>
            <Edit
              disabled={!template.can_edit}
              title={template.can_edit ? `编辑模板 ${templateName}` : `您没有编辑此模板的权限.`}
              data-test-id={`edit-template-${s.slugify(templateName)}`}
              onclick={vnode.attrs.onEdit.bind(vnode.attrs, template)}/>
            <Lock
              disabled={!headerMeta().isUserAdmin}
              title={headerMeta().isUserAdmin ? `编辑模板 ${templateName} 的权限` : `您没有权限编辑此模板的权限。只有系统管理员才能编辑模板。`}
              data-test-id={`edit-template-permissions-${s.slugify(templateName)}`}
              onclick={vnode.attrs.editPermissions.bind(vnode.attrs, template)}/>
            <Delete
              disabled={!this.isDeleteEnabled(vnode)}
              data-test-id={`delete-template-${s.slugify(templateName)}`}
              title={this.getDeleteButtonTitle(vnode)}
              onclick={vnode.attrs.onDelete.bind(vnode.attrs, template)}/>
          </IconGroup>
        </span>
      </div>
    );
  }

  private getDeleteButtonTitle(vnode: m.Vnode<TemplateAttrs, this>) {
    if (!vnode.attrs.template.can_administer) {
      return `您没有删除此模板的权限`;
    }
    if (_.isEmpty(vnode.attrs.template._embedded.pipelines)) {
      return `删除模板 '${vnode.attrs.template.name}'.`;
    }
    return `无法删除模板 '${vnode.attrs.template.name}' 因为它正在被算法使用。`;
  }

  private isDeleteEnabled(vnode: m.Vnode<TemplateAttrs, this>) {
    return vnode.attrs.template.can_administer && _.isEmpty(vnode.attrs.template._embedded.pipelines);
  }
}

export class AdminTemplatesWidget extends MithrilViewComponent<Attrs> {

  public static helpText() {
    return <ul>
      <li>模板化有助于创建可重复使用的工作流，并使管理大量算法变得更容易。</li>
      <li>管理员可以让任何用户通过成为模板管理员来编辑模板。
        <Link href={docsUrl("configuration/pipeline_templates.html")} externalLinkIcon={true}> 学习更多</Link>
      </li>
    </ul>;
  }

  view(vnode: m.Vnode<Attrs>) {
    const templateUrl = "configuration/pipeline_templates.html";
    const docLink     = <span data-test-id="doc-link">
       <Link href={docsUrl(templateUrl)} target="_blank" externalLinkIcon={true}>
        学习更多
      </Link>
    </span>;

    if (vnode.attrs.scrollOptions.sm.hasTarget()) {
      const target           = vnode.attrs.scrollOptions.sm.getTarget();
      const hasAnchorElement = vnode.attrs.templates.some((temp) => temp.name === target);
      if (!hasAnchorElement) {
        const msg = `Either '${target}' template has not been set up or you are not authorized to view the same.`;
        return <FlashMessage dataTestId="anchor-template-not-present" type={MessageType.alert}>
          {msg} {docLink}
        </FlashMessage>;
      }
    }
    if (_.isEmpty(vnode.attrs.templates)) {
      const noTemplatesFoundMsg = <span>
      要么没有设置模板，要么您无权查看模板. {docLink}
    </span>;

      return [
        <FlashMessage type={MessageType.info} message={noTemplatesFoundMsg}
                      dataTestId="no-template-present-msg"/>,
        <div className={styles.tips}>
          {AdminTemplatesWidget.helpText()}
        </div>
      ];
    }
    return (
      <div data-test-id="templates">
        {vnode.attrs.templates.map((eachTemplate) => {
          return <TemplateWidget template={eachTemplate} {...vnode.attrs} />;
        })}
      </div>
    );

  }
}
