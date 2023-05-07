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
package com.thoughtworks.go.server.web;

import com.thoughtworks.go.domain.FileHandler;
import com.thoughtworks.go.domain.JobIdentifier;
import com.thoughtworks.go.server.domain.ZippedArtifact;
import com.thoughtworks.go.util.ArtifactLogUtil;
import com.thoughtworks.go.util.GoConstants;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.AbstractView;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.util.HashMap;
import java.util.Map;

import static javax.servlet.http.HttpServletResponse.*;

public class FileModelAndView {

    /**
     * This is a static factory class and should never be instantiated
     */
    private FileModelAndView() {

    }


    protected static boolean isFileChanged(File file, String sha) {
        try {
            String currentHash = FileHandler.sha1Digest(file);
            return !currentHash.equals(sha);
        } catch (Exception e) {
            return true;
        }
    }


    public static ModelAndView createFileView(File file, String sha) {
        boolean hasChanged = isFileChanged(file, sha);
        if (!hasChanged) {
            return new ModelAndView(new AbstractView() {
                @Override
                protected void renderMergedOutputModel(Map model, HttpServletRequest request,
                                                       HttpServletResponse response) throws Exception {
                    response.setStatus(HttpServletResponse.SC_NOT_MODIFIED);
                    response.getWriter().close();
                }
            });
        } else {
            HashMap model = new HashMap();
			if (file instanceof ZippedArtifact) {
				model.put(FileView.NEED_TO_ZIP, true);
			}
            model.put("targetFile", file);
            return new ModelAndView("fileView", model);
        }
    }

    public static ArtifactFolderViewFactory jsonViewfactory() {
        return new JsonArtifactViewFactory();
    }

    public static ArtifactFolderViewFactory htmlViewFactory() {
        return new HtmlArtifactFolderViewFactory();
    }

    public static ModelAndView forbiddenUrl(String filePath) {
        return ResponseCodeView.create(SC_FORBIDDEN, "Url " + filePath + " 包含被禁止的字符.");
    }

    public static ModelAndView fileCreated(String filePath) {
        return ResponseCodeView.create(SC_CREATED, "文件 " + filePath + " 创建成功");
    }

    public static ModelAndView fileAppended(String filePath) {
        return ResponseCodeView.create(SC_OK, "文件 " + filePath + " 成功追加");
    }

    public static ModelAndView errorSavingFile(String filePath) {
        return ResponseCodeView.create(SC_INTERNAL_SERVER_ERROR, "保存文件 " + filePath+"错误");
    }

    public static ModelAndView errorSavingChecksumFile(String filePath) {
        return ResponseCodeView.create(SC_INTERNAL_SERVER_ERROR, String.format("保存路径'%s'处的文档校验和文件时出错'", filePath));
    }

    public static ModelAndView invalidUploadRequest() {
        String content = "无效的请求. MultipartFile 必须拥有名称 '" + GoConstants.REGULAR_MULTIPART_FILENAME + "'"
                + " 或者 '" + GoConstants.ZIP_MULTIPART_FILENAME + "' (自动解压缩)";
        return ResponseCodeView.create(SC_BAD_REQUEST, content);
    }

    public static ModelAndView fileNotFound(String filePath) {
        if ((ArtifactLogUtil.getConsoleOutputFolderAndFileName()).equals(filePath)) {
            return ResponseCodeView.create(SC_NOT_FOUND, "此作业的控制台日志不可用，因为它可能已被清除或从外部删除。");
        }
        return ResponseCodeView.create(SC_NOT_FOUND, "文档 '" + filePath + "' 不可用，因为它可能已被清除或从外部删除。");
    }

    public static ModelAndView fileAlreadyExists(String filePath) {
        return ResponseCodeView.create(SC_FORBIDDEN, "文件 " + filePath + " 已存在目录.");
    }

    private static class HtmlArtifactFolderViewFactory implements ArtifactFolderViewFactory {
        @Override
        public ModelAndView createView(JobIdentifier identifier, ArtifactFolder artifactFolder) {
            Map mav = new HashMap();
            mav.put("jobIdentifier", identifier);
            mav.put("presenter", artifactFolder);
            return new ModelAndView("rest/html", mav);
        }
    }

}
