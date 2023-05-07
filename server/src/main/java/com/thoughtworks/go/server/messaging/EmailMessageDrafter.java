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
package com.thoughtworks.go.server.messaging;

import com.thoughtworks.go.domain.AgentInstance;
import com.thoughtworks.go.util.StringUtil;
import com.thoughtworks.go.util.SystemEnvironment;
import com.thoughtworks.go.util.SystemUtil;

import java.util.Set;

import static com.thoughtworks.go.CurrentGoCDVersion.docsUrl;

public class EmailMessageDrafter {
    private static final String LOW_ARTIFACTS_DISK_SPACE_EMAIL =
            "The email has been sent out automatically by the Go server at (%s) to Go administrators.\n"
                    + "\n"
                    + "This server has less than %sMb of disk space available at %s to store artifacts. "
                    + "When the available space goes below %sMb, Go will stop scheduling. "
                    + "Please ensure enough space is available. You can read more about Go's artifacts repository, "
                    + "including our recommendation to create a separate partition for it at "
                    + docsUrl("/installation/configuring_server_details.html") + "\n";

    private static final String NO_ARTIFACTS_DISK_SPACE_EMAIL =
            "The email has been sent out automatically by the Go server at (%s) to Go administrators.\n"
                    + "\n"
                    + "This server has stopped scheduling "
                    + "because it has less than %sMb of disk space available at %s to store artifacts. "
                    + "Please ensure enough space is available. You can read more about Go's artifacts repository, "
                    + "including our recommendation to create a separate partition for it at "
                    + docsUrl("/installation/configuring_server_details.html") + "\n";

    private static final String LOW_DATABASE_DISK_SPACE_EMAIL =
            "The email has been sent out automatically by the Go server at (%s) to Go administrators.\n"
                    + "\n"
                    + "This server has less than %sMb of disk space available at %s to store data. "
                    + "When the available space goes below %sMb, Go will stop scheduling. "
                    + "Please ensure enough space is available.\n";

    private static final String NO_DATABASE_DISK_SPACE_EMAIL =
            "The email has been sent out automatically by the Go server at (%s) to Go administrators.\n"
                    + "\n"
                    + "This server has stopped scheduling "
                    + "because it has less than %sMb of disk space available at %s to store data. "
                    + "Please ensure enough space is available.\n";

    public static SendEmailMessage lowArtifactsDiskSpaceMessage(SystemEnvironment systemEnvironment, String adminMail,
                                                                String targetFolder) {
        String ipAddress = SystemUtil.getFirstLocalNonLoopbackIpAddress();
        return new SendEmailMessage(
                "低磁盘空间警告在 " + ipAddress, String.format(
                        LOW_ARTIFACTS_DISK_SPACE_EMAIL, ipAddress, systemEnvironment.getArtifactRepositoryWarningLimit(),
                        targetFolder,
                        systemEnvironment.getArtifactRepositoryFullLimit()), adminMail);
    }

    public static SendEmailMessage noArtifactsDiskSpaceMessage(SystemEnvironment systemEnvironment, String adminMail,
                                                               String targetFolder) {
        String ipAddress = SystemUtil.getFirstLocalNonLoopbackIpAddress();
        long size = systemEnvironment.getArtifactRepositoryFullLimit();
        return new SendEmailMessage(
                "磁盘空间错误消息在 " + ipAddress, String.format(
                        NO_ARTIFACTS_DISK_SPACE_EMAIL, ipAddress, size, targetFolder), adminMail);
    }

    public static SendEmailMessage lowDatabaseDiskSpaceMessage(SystemEnvironment systemEnvironment, String adminMail,
                                                               String targetFolder) {
        String ipAddress = SystemUtil.getFirstLocalNonLoopbackIpAddress();
        return new SendEmailMessage(
                "低磁盘空间警告在 " + ipAddress, String.format(
                        LOW_DATABASE_DISK_SPACE_EMAIL, ipAddress, systemEnvironment.getDatabaseDiskSpaceWarningLimit(),
                        targetFolder,
                        systemEnvironment.getDatabaseDiskSpaceFullLimit()), adminMail);
    }

    public static SendEmailMessage noDatabaseDiskSpaceMessage(SystemEnvironment systemEnvironment, String adminMail,
                                                              String targetFolder) {
        String ipAddress = SystemUtil.getFirstLocalNonLoopbackIpAddress();
        return new SendEmailMessage(
                "无磁盘空间错误在 " + ipAddress, String.format(
                        NO_DATABASE_DISK_SPACE_EMAIL, ipAddress, systemEnvironment.getDatabaseDiskSpaceFullLimit(),
                        targetFolder), adminMail);
    }

    public static SendEmailMessage backupSuccessfullyCompletedMessage(String backupDir, String adminEmail, String username) {
        String ipAddress = SystemUtil.getFirstLocalNonLoopbackIpAddress();
        String body = String.format("在 '%s' 的服务器的备份已成功完成. 备份存储在位置： %s. 此备份触发自 '%s'.", ipAddress, backupDir, username);
        return new SendEmailMessage("服务器备份已成功完成", body, adminEmail);
    }

    public static SendEmailMessage backupFailedMessage(String exceptionMessage, String adminEmail) {
        String ipAddress = SystemUtil.getFirstLocalNonLoopbackIpAddress();
        return new SendEmailMessage("服务器备份失败",String.format("在 '%s' 上的服务备份失败. 原因：%s", ipAddress, exceptionMessage),adminEmail);
    }

    public static SendEmailMessage agentLostContact(AgentInstance agentInstance, Set<String> environments, final String adminEmail) {
        String ipAddress = SystemUtil.getFirstLocalNonLoopbackIpAddress();
        return new SendEmailMessage(String.format("[失去联系] 节点主机: %s", agentInstance.getHostname()),
                String.format("该电子邮件已由位于（%s）的服务器自动发送给管理员。\n"
                        + "\n"
                        + "服务器已与节点失去联系:\n"
                        + "\n"
                        + "节点名称: %s\n"
                        + "剩余空间: %s\n"
                        + "沙盒: %s\n"
                        + "IP 地址: %s\n"
                        + "操作系统: %s\n"
                        + "资源: %s\n"
                        + "环境: %s\n"
                        + "\n"
                        + "失去联系时间: %s",
                        ipAddress,
                        agentInstance.getHostname(),
                        agentInstance.freeDiskSpace(),
                        agentInstance.getLocation(),
                        agentInstance.getIpAddress(),
                        agentInstance.getOperatingSystem(),
                        agentInstance.getResourceConfigs(),
                        StringUtil.joinForDisplay(environments),
                        agentInstance.getLastHeardTime()), adminEmail);
    }
}
