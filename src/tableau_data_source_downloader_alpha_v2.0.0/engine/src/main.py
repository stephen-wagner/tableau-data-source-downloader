# Copyright (C) 2019 Alteryx, Inc. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.
"""Example Source Tool implementation."""

# 3rd Party Libraries
import AlteryxPythonSDK as sdk
import tableauserverclient as TSC
import pandas as pd
import os
import re
import zipfile

from snakeplane.plugin_factory import PluginFactory

# Initialization of the plug in factory, used for making the AyxPlugin class
factory = PluginFactory("tableau_data_source_downloader_alpha_v2.0.0")


@factory.initialize_plugin
def init(input_mgr, user_data, logger):
    """Initialize the example source tool."""
    # Get the selected value from the GUI and save it for later use in the user_data
    user_data.server_url = input_mgr.workflow_config["serverURL"] if 'serverURL' in input_mgr.workflow_config else None
    user_data.site_name = input_mgr.workflow_config["siteName"] if 'siteName' in input_mgr.workflow_config else None
    user_data.username = input_mgr.workflow_config["username"] if 'username' in input_mgr.workflow_config else None
    user_data.password = input_mgr.workflow_config["password"] if 'password' in input_mgr.workflow_config else None
    user_data.data_source_name = input_mgr.workflow_config["dataSourceName"] if 'dataSourceName' in input_mgr.workflow_config else None
    user_data.download_location = input_mgr.workflow_config["downloadLocation"] if 'downloadLocation' in input_mgr.workflow_config else None

    if user_data.server_url == None:
        logger.display_error_msg("Enter server URL")
        return False
        
    if user_data.site_name == None:
        logger.display_error_msg("Enter site name")
        return False

    if user_data.username == None:
        logger.display_error_msg("Enter username")
        return False

    if user_data.password == None:
        logger.display_error_msg("Enter password")
        return False
    else:
        user_data.password = input_mgr._plugin._engine_vars.alteryx_engine.decrypt_password(input_mgr.workflow_config["password"])
    
    if user_data.data_source_name == None:
        logger.display_error_msg("Select data source to download")
        return False

    if user_data.download_location == None:
        logger.display_error_msg("Select folder to save data source to")
        return False
    else:
        user_data.download_location = user_data.download_location.replace('\\', '/')

    return True

@factory.process_data(mode="source")
def process_data(output_mgr, user_data, logger):
    
    tableau_auth = TSC.TableauAuth(user_data.username, user_data.password, user_data.site_name)
    server = TSC.Server(user_data.server_url)

    with server.auth.sign_in(tableau_auth):
        all_datasources, pagination_item = server.datasources.get()
        datasource = [datasource for datasource in all_datasources if datasource.name == user_data.data_source_name]
        tdsx_file_path = server.datasources.download(datasource[0].id, filepath=user_data.download_location)
        logger.display_info_msg("Downloaded the .tdsx file to {0}.".format(tdsx_file_path))

    zip_file_path = re.sub(r'.tdsx', '.zip', tdsx_file_path)

    if os.path.exists(zip_file_path):
        os.remove(zip_file_path)

    os.rename(tdsx_file_path, zip_file_path)

    zip_download_folder_path = os.path.split(zip_file_path)[0]
    extract_to_path = zip_download_folder_path + '\\' + user_data.data_source_name +'_extracted' 

    data_extracts_folder_path = extract_to_path + '\Data\Extracts'

    if os.path.exists(data_extracts_folder_path):
        files_in_data_extracts_folder = os.listdir(data_extracts_folder_path)

        for item in files_in_data_extracts_folder:
            os.remove(data_extracts_folder_path + '\\' + item)

    with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to_path)

    hyper_file_path = data_extracts_folder_path + '\\' + os.listdir(data_extracts_folder_path)[0]
    updated_hyper_file_path = data_extracts_folder_path + '\\' + user_data.data_source_name + '.hyper'
        
    os.rename(hyper_file_path, updated_hyper_file_path)
    
    logger.display_info_msg("Extracted .hyper file from .tdsx to {0}.".format(updated_hyper_file_path))
    data_out = output_mgr["Output"]
    data_out.data = pd.DataFrame({"File Location": [updated_hyper_file_path]})
    
    return 
    
@factory.build_metadata
def build_metadata(output_mgr):
    metadata = output_mgr.create_anchor_metadata()
    metadata.add_column("File Location", sdk.FieldType.string, source="Tableau Data Source Downloader")
    data_out = output_mgr["Output"]
    data_out.metadata = metadata

    return

AyxPlugin = factory.generate_plugin()
