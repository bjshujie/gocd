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
import m from "mithril";
import Stream from "mithril/stream";
import {PackageRepositories} from "models/package_repositories/package_repositories";
import {getPackageRepository, pluginInfoWithPackageRepositoryExtension} from "models/package_repositories/spec/test_data";
import {PluginInfo, PluginInfos} from "models/shared/plugin_infos_new/plugin_info";
import {PackageOperations, PackageRepoOperations} from "views/pages/package_repositories";
import {stubAllMethods, TestHelper} from "views/pages/spec/test_helper";
import {PackageRepoScrollOptions, PackageRepositoriesWidget} from "../package_repositories_widget";

describe('PackageRepositoriesWidgetSpec', () => {
  const helper = new TestHelper();
  let pkgRepos: Stream<PackageRepositories>;
  let pluginInfos: Stream<PluginInfos>;
  let scrollOptions: PackageRepoScrollOptions;

  afterEach((done) => helper.unmount(done));
  beforeEach(() => {
    pkgRepos      = Stream(PackageRepositories.fromJSON([getPackageRepository()]));
    pluginInfos   = Stream(new PluginInfos(PluginInfo.fromJSON(pluginInfoWithPackageRepositoryExtension())));
    scrollOptions = {
      package_repo_sm: {
        sm:                          stubAllMethods(["shouldScroll", "getTarget", "setTarget", "scrollToEl", "hasTarget"]),
        shouldOpenEditView:          false,
        shouldOpenCreatePackageView: false
      },
      package_sm:      {
        sm:                 stubAllMethods(["shouldScroll", "getTarget", "setTarget", "scrollToEl", "hasTarget"]),
        shouldOpenEditView: false
      }
    };
  });

  function mount() {
    const pkgRepoOps = new PackageRepoOperations();
    const pkgOps     = new PackageOperations();
    helper.mount(() => <PackageRepositoriesWidget packageRepositories={pkgRepos}
                                                  pluginInfos={pluginInfos}
                                                  packageOperations={pkgOps}
                                                  packageRepoOperations={pkgRepoOps} scrollOptions={scrollOptions}/>);
  }

  it('should render info div if repos is empty', () => {
    pkgRepos(new PackageRepositories());
    mount();

    expect(helper.byTestId('package-repositories-widget')).not.toBeInDOM();
    const helpInfo = helper.byTestId('package-repo-info');
    expect(helpInfo).toBeInDOM();
    expect(helper.qa('li', helpInfo)[0].textContent).toBe('单击“创建包存储库”以添加新的包存储库。');
    expect(helper.qa('li', helpInfo)[1].textContent).toBe('可以设置包存储库，将包用作算法中的材料。你可以在这里阅读更多内容。.');

    expect(helper.q('a', helpInfo)).toHaveAttr('href', docsUrl("extension_points/package_repository_extension.html"));

  });

  it('should render error info if the element specified in the anchor does not exist', () => {
    scrollOptions.package_repo_sm.sm = {
      hasTarget:    jasmine.createSpy().and.callFake(() => true),
      getTarget:    jasmine.createSpy().and.callFake(() => "some-repo"),
      shouldScroll: jasmine.createSpy(),
      setTarget:    jasmine.createSpy(),
      scrollToEl:   jasmine.createSpy()
    };
    mount();

    expect(helper.byTestId("anchor-package-repo-not-present")).toBeInDOM();
    expect(helper.textByTestId("anchor-package-repo-not-present")).toBe("'some-repo' 尚未设置程序包存储库.");
  });
});
