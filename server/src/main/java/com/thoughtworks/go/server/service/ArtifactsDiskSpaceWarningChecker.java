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
package com.thoughtworks.go.server.service;

import com.thoughtworks.go.server.messaging.EmailMessageDrafter;
import com.thoughtworks.go.server.messaging.SendEmailMessage;
import com.thoughtworks.go.server.service.result.OperationResult;
import com.thoughtworks.go.serverhealth.HealthStateLevel;
import com.thoughtworks.go.serverhealth.ServerHealthService;
import com.thoughtworks.go.util.SystemEnvironment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static com.thoughtworks.go.server.service.ArtifactsDiskSpaceFullChecker.ARTIFACTS_DISK_FULL_ID;

public class ArtifactsDiskSpaceWarningChecker extends DiskSpaceChecker {
    private static final Logger LOGGER = LoggerFactory.getLogger(ArtifactsDiskSpaceWarningChecker.class);
    private final ServerHealthService serverHealthService;

    public ArtifactsDiskSpaceWarningChecker(SystemEnvironment systemEnvironment, EmailSender warningEmailSender, GoConfigService goConfigService,
                                            final SystemDiskSpaceChecker diskSpaceChecker, final ServerHealthService serverHealthService) {
        super(warningEmailSender, systemEnvironment, goConfigService.artifactsDir(), goConfigService, ARTIFACTS_DISK_FULL_ID, diskSpaceChecker);
        this.serverHealthService = serverHealthService;
    }

    @Override
    protected long limitInMb() {
        return systemEnvironment.getArtifactRepositoryWarningLimit();
    }

    @Override
    protected void createFailure(OperationResult result, long size, long availableSpace) {
        String msg = "服务器只有少于  " + size + "M 磁盘可用.";
        LOGGER.warn(msg);
        result.warning("服务的文档仓库正在运行在低磁盘空间下", msg, ARTIFACTS_DISK_FULL_ID);
    }

    @Override
    protected SendEmailMessage createEmail() {
        return EmailMessageDrafter.lowArtifactsDiskSpaceMessage(systemEnvironment, getAdminMail(), targetFolderCanonicalPath());
    }

    @Override
    public void check(OperationResult result) {
        if (!serverHealthService.containsError(ARTIFACTS_DISK_FULL_ID, HealthStateLevel.ERROR)) {
            super.check(result);
        }
    }
}
