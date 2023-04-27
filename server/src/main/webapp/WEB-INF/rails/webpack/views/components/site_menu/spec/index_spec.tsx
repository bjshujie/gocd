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
import m from "mithril";
import {Attrs, SiteMenu} from "views/components/site_menu/index";
import styles from "views/components/site_menu/index.scss";
import {TestHelper} from "views/pages/spec/test_helper";
import {asSelector} from "../../../../helpers/css_proxies";

describe("Site Menu", () => {

  const helper = new TestHelper();
  afterEach(helper.unmount.bind(helper));
  const sel = asSelector(styles);

  it("should display the menus for an admin", () => {
    mount({
            canViewTemplates: true,
            isGroupAdmin:     true,
            isUserAdmin:      true,
            canViewAdminPage: true,
            showAnalytics:    true,
          } as Attrs);
    const dashboard = helper.qa("a").item(0);
    const agents    = helper.qa("a").item(1);
    const materials = helper.qa("a").item(2);
    const analytics = helper.qa("a").item(3);
    const admin     = helper.qa("a").item(4);
    expect(dashboard).toHaveText("Dashboard");
    expect(dashboard).toHaveAttr("href", "/go/pipelines");
    expect(agents).toHaveText("节点");
    expect(agents).toHaveAttr("href", "/go/agents");
    expect(materials).toHaveText("Materials");
    expect(materials).toHaveAttr("href", "/go/materials");
    expect(analytics).toHaveText("分析");
    expect(analytics).toHaveAttr("href", "/go/analytics");
    expect(admin).toHaveText("系统管理");
    expect(findMenuItem("/go/admin/pipelines")).toHaveText("算法");
    expect(findMenuItem("/go/admin/config_repos")).toHaveText("配置仓库");
    expect(findMenuItem("/go/admin/environments")).toHaveText("环境");
    expect(findMenuItem("/go/admin/templates")).toHaveText("模板");
    expect(findMenuItem("/go/admin/elastic_agent_configurations")).toHaveText("弹性节点配置");
    expect(findMenuItem("/go/admin/config_xml")).toHaveText("配置 XML");
    expect(findMenuItem("/go/admin/artifact_stores")).toHaveText("文档存储");
    expect(findMenuItem("/go/admin/secret_configs")).toHaveText("保密管理");
    expect(findMenuItem("/go/admin/maintenance_mode")).toHaveText("服务器维护模式");
    expect(findMenuItem("/go/admin/config/server")).toHaveText("服务器配置");
    expect(findMenuItem("/go/admin/users")).toHaveText("用户管理");
    expect(findMenuItem("/go/admin/backup")).toHaveText("备份");
    expect(findMenuItem("/go/admin/plugins")).toHaveText("插件");
    expect(findMenuItem("/go/admin/package_repositories/new")).toHaveText("包仓库");
    expect(findMenuItem("/go/admin/security/auth_configs")).toHaveText("授权配置");
    expect(findMenuItem("/go/admin/security/roles")).toHaveText("角色配置");
    expect(findMenuItem("/go/admin/admin_access_tokens")).toHaveText("访问令牌管理");
    expect(findMenuItem("/go/admin/scms")).toHaveText("SCM 插件");
    expect(helper.qa(`a${sel.siteNavLink}`)).toHaveLength(5);
    expect(helper.qa(`a${sel.siteSubNavLink}`)).toHaveLength(18);
  });

  it("should display the menus for users who can view templates", () => {
    mount({
            canViewTemplates: true,
            isGroupAdmin:     false,
            isUserAdmin:      false,
            canViewAdminPage: true,
            showAnalytics:    true,
          } as Attrs);
    const dashboard = helper.qa("a").item(0);
    const agents    = helper.qa("a").item(1);
    const materials = helper.qa("a").item(2);
    const analytics = helper.qa("a").item(3);
    const admin     = helper.qa("a").item(4);
    expect(dashboard).toHaveText("Dashboard");
    expect(dashboard).toHaveAttr("href", "/go/pipelines");
    expect(agents).toHaveText("节点");
    expect(agents).toHaveAttr("href", "/go/agents");
    expect(materials).toHaveText("Materials");
    expect(materials).toHaveAttr("href", "/go/materials");
    expect(analytics).toHaveText("分析");
    expect(analytics).toHaveAttr("href", "/go/analytics");
    expect(admin).toHaveText("系统管理");
    expect(findMenuItem("/go/admin/pipelines")).toBeFalsy();
    expect(findMenuItem("/go/admin/config_repos")).toHaveText("配置仓库");
    expect(findMenuItem("/go/admin/templates")).toHaveText("模板");
    expect(findMenuItem("/go/admin/environments")).toHaveText("环境");
    expect(findMenuItem("/go/admin/elastic_agent_configurations")).toHaveText("弹性节点配置");
    expect(findMenuItem("/go/admin/config_xml")).toBeFalsy();
    expect(findMenuItem("/go/admin/config/server")).toBeFalsy();
    expect(findMenuItem("/go/admin/users")).toBeFalsy();
    expect(findMenuItem("/go/admin/backup")).toBeFalsy();
    expect(findMenuItem("/go/admin/plugins")).toBeFalsy();
    expect(findMenuItem("/go/admin/package_repositories/new")).toBeFalsy();
    expect(findMenuItem("/go/admin/security/auth_configs")).toBeFalsy();
    expect(findMenuItem("/go/admin/security/roles")).toBeFalsy();
    expect(findMenuItem("/go/admin/scms")).toBeFalsy();
    expect(helper.qa(`a${sel.siteNavLink}`)).toHaveLength(5);
    expect(helper.qa(`a${sel.siteSubNavLink}`)).toHaveLength(4);
  });

  it("should display the menus for Group Admins", () => {
    mount({
            canViewTemplates: true,
            isGroupAdmin:     true,
            isUserAdmin:      false,
            canViewAdminPage: true,
            showAnalytics:    true,
          } as Attrs);
    const dashboard = helper.qa("a").item(0);
    const agents    = helper.qa("a").item(1);
    const materials = helper.qa("a").item(2);
    const analytics = helper.qa("a").item(3);
    const admin     = helper.qa("a").item(4);
    expect(dashboard).toHaveText("Dashboard");
    expect(dashboard).toHaveAttr("href", "/go/pipelines");
    expect(agents).toHaveText("节点");
    expect(agents).toHaveAttr("href", "/go/agents");
    expect(materials).toHaveText("Materials");
    expect(materials).toHaveAttr("href", "/go/materials");
    expect(analytics).toHaveText("分析");
    expect(analytics).toHaveAttr("href", "/go/analytics");
    expect(admin).toHaveText("系统管理");
    expect(findMenuItem("/go/admin/pipelines")).toHaveText("算法");
    expect(findMenuItem("/go/admin/environments")).toHaveText("环境");
    expect(findMenuItem("/go/admin/config_repos")).toHaveText("配置仓库");
    expect(findMenuItem("/go/admin/templates")).toHaveText("模板");
    expect(findMenuItem("/go/admin/elastic_agent_configurations")).toHaveText("弹性节点配置");
    expect(findMenuItem("/go/admin/pipelines/snippet")).toHaveText("配置 XML");
    expect(findMenuItem("/go/admin/config/server")).toBeFalsy();
    expect(findMenuItem("/go/admin/users")).toBeFalsy();
    expect(findMenuItem("/go/admin/backup")).toBeFalsy();
    expect(findMenuItem("/go/admin/plugins")).toHaveText("插件");
    expect(findMenuItem("/go/admin/package_repositories/new")).toHaveText("包仓库");
    expect(findMenuItem("/go/admin/security/auth_configs")).toBeFalsy();
    expect(findMenuItem("/go/admin/security/roles")).toBeFalsy();
    expect(findMenuItem("/go/admin/scms")).toHaveText("SCM 插件");
    expect(helper.qa(`a${sel.siteNavLink}`)).toHaveLength(5);
    expect(helper.qa(`a${sel.siteSubNavLink}`)).toHaveLength(9);
  });

  it("should not show analytics when the attribute is passed as false", () => {
    mount({
            canViewTemplates: true,
            isGroupAdmin:     true,
            isUserAdmin:      false,
            canViewAdminPage: true,
            showAnalytics:    false,
          } as Attrs);
    const dashboard = helper.qa("a").item(0);
    const agents    = helper.qa("a").item(1);
    const materials = helper.qa("a").item(2);
    const admin     = helper.qa("a").item(3);
    expect(dashboard).toHaveText("Dashboard");
    expect(dashboard).toHaveAttr("href", "/go/pipelines");
    expect(agents).toHaveText("节点");
    expect(agents).toHaveAttr("href", "/go/agents");
    expect(materials).toHaveText("Materials");
    expect(materials).toHaveAttr("href", "/go/materials");
    expect(admin).toHaveText("系统管理");
    expect(findMenuItem("/go/analytics")).toBeFalsy();
  });

  it("should show Admin link for non-admins", () => {
    mount({
            canViewTemplates: true,
            isGroupAdmin:     false,
            isUserAdmin:      false,
            canViewAdminPage: false,
            showAnalytics:    false,
          } as Attrs);
    const dashboard = helper.qa("a").item(0);
    const agents    = helper.qa("a").item(1);
    const materials = helper.qa("a").item(2);
    const admin     = helper.qa("a").item(3);
    expect(dashboard).toHaveText("Dashboard");
    expect(dashboard).toHaveAttr("href", "/go/pipelines");
    expect(agents).toHaveText("节点");
    expect(agents).toHaveAttr("href", "/go/agents");
    expect(materials).toHaveText("Materials");
    expect(materials).toHaveAttr("href", "/go/materials");
    expect(admin).toHaveText("系统管理");
    expect(findMenuItem("/go/admin/environments")).toHaveText("环境");
    expect(findMenuItem("/go/admin/config_repos")).toHaveText("配置仓库");
    expect(findMenuItem("/go/admin/elastic_agent_configurations")).toHaveText("弹性节点配置");
    expect(findMenuItem("/go/admin/scms")).toBeFalsy();

    expect(helper.qa(`a${sel.siteSubNavLink}`)).toHaveLength(3);
  });

  function mount(menuAttrs: Attrs) {
    helper.mount(() => <SiteMenu {...menuAttrs}/>);
  }

  function findMenuItem(href: string) {
    return helper.q(`a[href='${href}']`);
  }

});
