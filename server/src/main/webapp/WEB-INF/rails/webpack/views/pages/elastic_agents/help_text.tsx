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
import {ConceptDiagram} from "views/components/concept_diagram";
import conceptDiagramCss from "views/pages/elastic_agents/concept_diagram.scss";
import styles from "views/pages/elastic_agents/help_text.scss";

const clusterProfileImg      = require("../../../../app/assets/images/elastic_agents/cluster_profile.svg");
const elasticAgentProfileImg = require("../../../../app/assets/images/elastic_agents/elastic_agent_profile.svg");
const finishImg              = require("../../../../app/assets/images/elastic_agents/finish.svg");

export class HelpText extends MithrilViewComponent {
  view(vnode: m.Vnode) {
    return (
      <div>
        <div class={styles.panelHeader}>
          <h3 class={styles.panelTitle}>配置弹性节点</h3>
        </div>
        <div class={styles.concepts}>
          <ConceptDiagram image={clusterProfileImg} css={conceptDiagramCss}>
            <h3>第 1 步: 创建群集配置文件</h3>
            <div>集群配置文件是运行弹性节点的环境的连接配置。</div>
          </ConceptDiagram>

          <ConceptDiagram image={elasticAgentProfileImg} css={conceptDiagramCss}>
            <h3>第 2 步：创建弹性节点配置文件</h3>
            <div>弹性配置文件通常包含弹性节点的配置信息</div>
          </ConceptDiagram>

          <ConceptDiagram image={finishImg} css={conceptDiagramCss}>
            <h3>&nbsp;&nbsp;第 3 步：完成！</h3>
          </ConceptDiagram>
        </div>
      </div>
    );
  }
}
