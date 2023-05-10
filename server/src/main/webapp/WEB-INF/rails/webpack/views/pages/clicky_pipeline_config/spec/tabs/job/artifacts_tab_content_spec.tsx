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

import Stream from "mithril/stream";
import {ArtifactStore, ArtifactStores} from "models/artifact_stores/artifact_stores";
import {Origin, OriginType} from "models/origin";
import {ArtifactType, ExternalArtifact, GoCDArtifact} from "models/pipeline_configs/artifact";
import {Job} from "models/pipeline_configs/job";
import {NameableSet} from "models/pipeline_configs/nameable_set";
import {PipelineConfig} from "models/pipeline_configs/pipeline_config";
import {JobTestData, PipelineConfigTestData} from "models/pipeline_configs/spec/test_data";
import {Stage} from "models/pipeline_configs/stage";
import {TemplateConfig} from "models/pipeline_configs/template_config";
import {Configurations} from "models/shared/configuration";
import {PluginInfo, PluginInfos} from "models/shared/plugin_infos_new/plugin_info";
import {ArtifactPluginInfo} from "models/shared/plugin_infos_new/spec/test_data";
import * as simulateEvent from "simulate-event";
import {FlashMessageModelWithTimeout} from "views/components/flash_message";
import {ArtifactsTabContent} from "views/pages/clicky_pipeline_config/tabs/job/artifacts_tab_content";
import {PipelineConfigRouteParams} from "views/pages/clicky_pipeline_config/tab_handler";
import {OperationState} from "views/pages/page_operations";
import {TestHelper} from "views/pages/spec/test_helper";

describe("Artifacts Tab", () => {
  let tab: ArtifactsTabContent;
  const helper = new TestHelper();

  beforeEach(() => {
    tab = new ArtifactsTabContent(jasmine.createSpy());
  });

  afterEach(helper.unmount.bind(helper));

  it("should render no artifacts configured message", () => {
    const job = Job.fromJSON(JobTestData.with("test"));
    mount(job);

    expect(job.artifacts()).toHaveLength(0);
    const expectedMsg = "未配置文档，点击'新建文档'来配置文档.";
    expect(helper.byTestId("flash-message-info")).toContainText(expectedMsg);
  });

  it("should render build artifact", () => {
    const job = Job.fromJSON(JobTestData.with("test"));
    job.artifacts().push(new GoCDArtifact(ArtifactType.build, "source", "destination"));
    mount(job);

    const typeDescription        = "文档有三种类型——构建、测试和外部。当选择test时，服务器将使用此文档生成测试报告。当选择工件类型external时，您可以配置外部文档存储，您可以将文档推送到该存储。";
    const sourceDescription      = "要发布到服务器的文件或文件夹。服务器将只上载作业的工作目录中的文件。您可以使用通配符指定要上载的文件和文件夹（**表示任何路径，*表示任何文件或文件夹名称）。";
    const destinationDescription = "目标是相对于服务器端当前实例的文档文件夹的。如果未指定，则文档将存储在文档目录的根目录中";

    expect(helper.byTestId("type-header")).toContainText("Type");
    expect(helper.allByTestId("tooltip-wrapper")[0]).toContainText(typeDescription);

    expect(helper.byTestId("source-header")).toContainText("Source");
    expect(helper.allByTestId("tooltip-wrapper")[1]).toContainText(sourceDescription);

    expect(helper.byTestId("destination-header")).toContainText("Destination");
    expect(helper.allByTestId("tooltip-wrapper")[2]).toContainText(destinationDescription);

    expect(job.artifacts()).toHaveLength(1);
    expect(helper.allByTestId("build-artifact-view")).toHaveLength(1);
    expect(helper.allByTestId("test-artifact-view")).toHaveLength(0);

    expect(helper.byTestId("artifact-type")).toHaveText("构建文档");
    expect(helper.byTestId("artifact-source-source")).toHaveValue("source");
    expect(helper.byTestId("artifact-destination-destination")).toHaveValue("destination");
  });

  it("should render test artifact", () => {
    const job = Job.fromJSON(JobTestData.with("test"));
    job.artifacts().push(new GoCDArtifact(ArtifactType.test, "source", "destination"));
    mount(job);

    const typeDescription        = "文档有三种类型——构建、测试和外部。当选择test时，服务器将使用此文档生成测试报告。当选择工件类型external时，您可以配置外部文档存储，您可以将文档推送到该存储。";
    const sourceDescription      = "要发布到服务器的文件或文件夹。服务器将只上载作业的工作目录中的文件。您可以使用通配符指定要上载的文件和文件夹（**表示任何路径，*表示任何文件或文件夹名称）。";
    const destinationDescription = "目标是相对于服务器端当前实例的文档文件夹的。如果未指定，则文档将存储在文档目录的根目录中";

    expect(helper.byTestId("type-header")).toContainText("类型");
    expect(helper.allByTestId("tooltip-wrapper")[0]).toContainText(typeDescription);

    expect(helper.byTestId("source-header")).toContainText("源");
    expect(helper.allByTestId("tooltip-wrapper")[1]).toContainText(sourceDescription);

    expect(helper.byTestId("destination-header")).toContainText("目标");
    expect(helper.allByTestId("tooltip-wrapper")[2]).toContainText(destinationDescription);

    expect(job.artifacts()).toHaveLength(1);
    expect(helper.allByTestId("build-artifact-view")).toHaveLength(0);
    expect(helper.allByTestId("test-artifact-view")).toHaveLength(1);

    expect(helper.byTestId("artifact-type")).toHaveText("测试报告文档");
    expect(helper.byTestId("artifact-source-source")).toHaveValue("source");
    expect(helper.byTestId("artifact-destination-destination")).toHaveValue("destination");
  });

  it("should remove artifact", () => {
    const job = Job.fromJSON(JobTestData.with("test"));
    job.artifacts().push(
      new GoCDArtifact(ArtifactType.build, "/path/to/source", "/dest"),
      new GoCDArtifact(ArtifactType.test, "/path/to/test", "/test")
    );
    mount(job);

    expect(job.artifacts()).toHaveLength(2);
    expect(helper.allByTestId("build-artifact-view")).toHaveLength(1);
    expect(helper.allByTestId("test-artifact-view")).toHaveLength(1);

    helper.click(`[data-test-id="remove-build-artifact"]`);

    expect(job.artifacts()).toHaveLength(1);
    expect(helper.allByTestId("build-artifact-view")).toHaveLength(0);
    expect(helper.allByTestId("test-artifact-view")).toHaveLength(1);

    helper.click(`[data-test-id="remove-test-artifact"]`);

    expect(job.artifacts()).toHaveLength(0);
    expect(helper.allByTestId("build-artifact-view")).toHaveLength(0);
    expect(helper.allByTestId("test-artifact-view")).toHaveLength(0);
  });

  it("should add a build artifact", () => {
    const job = Job.fromJSON(JobTestData.with("test"));
    mount(job);

    expect(job.artifacts()).toHaveLength(0);
    expect(helper.allByTestId("build-artifact-view")).toHaveLength(0);
    expect(helper.allByTestId("test-artifact-view")).toHaveLength(0);

    helper.click(`button`);

    expect(helper.allByTestId("build-artifact-view")).toHaveLength(1);

    helper.oninput(`[data-test-id="artifact-source-"]`, "/path/to/source");
    helper.oninput(`[data-test-id="artifact-destination-"]`, "/path/to/dest");

    expect(job.artifacts()).toHaveLength(1);
    expect(job.artifacts()[0].type()).toEqual(ArtifactType.build);
    expect((job.artifacts()[0] as GoCDArtifact).source()).toEqual("/path/to/source");
    expect((job.artifacts()[0] as GoCDArtifact).destination()).toEqual("/path/to/dest");
  });

  it("should add a test artifact", () => {
    const job = Job.fromJSON(JobTestData.with("test"));
    mount(job);

    expect(job.artifacts()).toHaveLength(0);
    expect(helper.allByTestId("build-artifact-view")).toHaveLength(0);
    expect(helper.allByTestId("test-artifact-view")).toHaveLength(0);

    const input = helper.q("select");

    (input as HTMLSelectElement).value = "test";
    simulateEvent.simulate(input, "change");

    helper.click(`button`);

    expect(helper.allByTestId("test-artifact-view")).toHaveLength(1);

    helper.oninput(`[data-test-id="artifact-source-"]`, "/path/to/source");
    helper.oninput(`[data-test-id="artifact-destination-"]`, "/path/to/dest");

    expect(job.artifacts()).toHaveLength(1);
    expect(job.artifacts()[0].type()).toEqual(ArtifactType.test);
    expect((job.artifacts()[0] as GoCDArtifact).source()).toEqual("/path/to/source");
    expect((job.artifacts()[0] as GoCDArtifact).destination()).toEqual("/path/to/dest");
  });

  it("should render no artifact store configured message", () => {
    mount(Job.fromJSON(JobTestData.with("test")));

    const input = helper.q("select");

    (input as HTMLSelectElement).value = ArtifactType.external;
    simulateEvent.simulate(input, "change");

    helper.redraw();

    const expectedMsg = "未配置任何文件存储。请到文件存储页面进行配置。";
    expect(helper.byTestId("flash-message-warning")).toContainText(expectedMsg);

    expect(helper.q("button")).toBeDisabled();
  });

  it("should allow adding external artifact store", () => {
    const pluginInfo = PluginInfo.fromJSON(ArtifactPluginInfo.docker());
    tab.pluginInfos(new PluginInfos(pluginInfo));
    tab.artifactStores(new ArtifactStores(new ArtifactStore("storeid", pluginInfo.id, new Configurations([]))));

    const job = Job.fromJSON(JobTestData.with("test"));
    mount(job);

    expect(job.artifacts()).toHaveLength(0);
    expect(helper.allByTestId("build-artifact-view")).toHaveLength(0);
    expect(helper.allByTestId("test-artifact-view")).toHaveLength(0);

    const input = helper.q("select");

    (input as HTMLSelectElement).value = ArtifactType.external;
    simulateEvent.simulate(input, "change");

    helper.click(`button`);

    expect(helper.allByTestId("external-artifact-view")).toHaveLength(1);
    expect(job.artifacts()).toHaveLength(1);
  });

  it("should show missing plugin error while adding external artifact", () => {
    const pluginInfo = PluginInfo.fromJSON(ArtifactPluginInfo.docker());
    tab.pluginInfos(new PluginInfos());
    tab.artifactStores(new ArtifactStores(new ArtifactStore("storeid", pluginInfo.id, new Configurations([]))));

    const job = Job.fromJSON(JobTestData.with("test"));
    job.artifacts().push(new ExternalArtifact("id", "storeid"));
    mount(job);

    expect(helper.allByTestId("external-artifact-view")).toHaveLength(1);
    const msg = "无法创建/编辑外部文档，因为缺少与文档存储“storeid”关联的外部文档插件“cd.go.artifact.docker.registry”！";

    expect(helper.byTestId("flash-message-info")).toContainText(msg);
  });

  it("should render external artifact", () => {
    const pluginInfo = PluginInfo.fromJSON(ArtifactPluginInfo.docker());
    tab.pluginInfos(new PluginInfos(pluginInfo));
    tab.artifactStores(new ArtifactStores(new ArtifactStore("storeid", pluginInfo.id, new Configurations([]))));

    const job = Job.fromJSON(JobTestData.with("test"));
    job.artifacts().push(new ExternalArtifact("id", "storeid"));
    mount(job);

    const typeDescription    = "文档有三种类型——构建、测试和外部。当选择test时，服务器将使用此文档生成测试报告。当选择工件类型external时，您可以配置外部文档存储，您可以将文档推送到该存储。";
    const idDescription      = "这个id用于标识被推送到外部存储的文档。id稍后在下游算法中使用，以从外部存储中获取文档。";
    const storeIdDescription = "这是对配置中定义的全局文档存储的引用。在将文档发布到外部存储时，插件会使用与此存储id相关联的全局属性。";

    expect(helper.byTestId("type-header")).toContainText("Type");
    expect(helper.allByTestId("tooltip-wrapper")[0]).toContainText(typeDescription);

    expect(helper.byTestId("id-header")).toContainText("Id");
    expect(helper.allByTestId("tooltip-wrapper")[1]).toContainText(idDescription);

    expect(helper.byTestId("store-id-header")).toContainText("Store Id");
    expect(helper.allByTestId("tooltip-wrapper")[2]).toContainText(storeIdDescription);

    expect(job.artifacts()).toHaveLength(1);
    expect(helper.allByTestId("external-artifact-view")).toHaveLength(1);

    expect(helper.byTestId("artifact-type")).toHaveText("外部文档");

    expect(helper.byTestId("artifact-id-id")).toHaveValue("id");
    expect(helper.byTestId("artifact-store-id")).toHaveValue("storeid");
  });

  it("should remove external artifact", () => {
    const pluginInfo = PluginInfo.fromJSON(ArtifactPluginInfo.docker());
    tab.pluginInfos(new PluginInfos(pluginInfo));
    tab.artifactStores(new ArtifactStores(new ArtifactStore("storeid", pluginInfo.id, new Configurations([]))));

    const job = Job.fromJSON(JobTestData.with("test"));
    job.artifacts().push(new ExternalArtifact("id", "storeid"));
    mount(job);

    expect(helper.allByTestId("external-artifact-view")).toHaveLength(1);

    helper.click(`[data-test-id="remove-external-artifact"]`);

    expect(helper.allByTestId("external-artifact-view")).toHaveLength(0);
  });

  describe("Read Only", () => {
    beforeEach(() => {
      const pluginInfo = PluginInfo.fromJSON(ArtifactPluginInfo.docker());
      tab.pluginInfos(new PluginInfos(pluginInfo));
      tab.artifactStores(new ArtifactStores(new ArtifactStore("storeid", pluginInfo.id, new Configurations([]))));

      const job = Job.fromJSON(JobTestData.with("test"));
      job.artifacts().push(new GoCDArtifact(ArtifactType.build, "source", "destination"));
      job.artifacts().push(new GoCDArtifact(ArtifactType.test, "testsource", "testdestination"));
      job.artifacts().push(new ExternalArtifact("id", "storeid"));
      mount(job, new Origin(OriginType.ConfigRepo, "repo1"));
    });

    it("should render readonly build artifact", () => {
      expect(helper.byTestId("artifact-source-source")).toBeDisabled();
      expect(helper.byTestId("artifact-destination-destination")).toBeDisabled();
    });

    it("should not render remove build artifact", () => {
      expect(helper.byTestId("remove-build-artifact")).not.toBeInDOM();
    });

    it("should render readonly test artifact", () => {
      expect(helper.byTestId("artifact-source-testsource")).toBeDisabled();
      expect(helper.byTestId("artifact-destination-testdestination")).toBeDisabled();
    });

    it("should not render remove test artifact", () => {
      expect(helper.byTestId("remove-test-artifact")).not.toBeInDOM();
    });

    it("should render readonly external artifact", () => {
      expect(helper.byTestId("artifact-id-id")).toBeDisabled();
      expect(helper.byTestId("artifact-store-id")).toBeDisabled();
    });

    it("should not render remove external artifact", () => {
      expect(helper.byTestId("remove-extrenal-artifact")).not.toBeInDOM();
    });

    it("should not render add artifacts", () => {
      expect(helper.byTestId("add-artifact-wrapper")).not.toBeInDOM();
    });
  });

  function mount(job: Job, origin: Origin = new Origin(OriginType.GoCD)) {
    document.body.setAttribute("data-meta", JSON.stringify({pipelineName: "pipeline1"}));
    const pipelineConfig = new PipelineConfig();
    pipelineConfig.origin(origin);

    const stage = Stage.fromJSON(PipelineConfigTestData.stage("Test"));
    stage.jobs(new NameableSet([job]));
    pipelineConfig.stages().add(stage);

    const routeParams = {
      stage_name: stage.name(),
      job_name: job.name()
    } as PipelineConfigRouteParams;

    const templateConfig = new TemplateConfig("foo", []);
    helper.mount(() => tab.content(pipelineConfig,
                                   templateConfig,
                                   routeParams,
                                   Stream<OperationState>(OperationState.UNKNOWN),
                                   new FlashMessageModelWithTimeout(),
                                   jasmine.createSpy(),
                                   jasmine.createSpy()));
  }
});
