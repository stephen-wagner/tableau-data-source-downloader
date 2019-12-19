# Tableau Data Source Downloader

## Description

The Tableau Data Source Downloader tool for Alteryx Designer provides a way to programmatically download .hyper files from a Tableau Server.

## Setting Up Your Environment

After the repo has been forked, you'll need to setup your environment.

Follow the steps below to complete the environment setup:

1. Complete the steps found under `Python installation` of [Python SDK](https://help.alteryx.com/developer/current/Python/Overview.htm).
2. Run `env/setup_environ.bat` from within the `pilot` directory. This script will create a virtual environment, using Alteryx's install of python, install snakeplane's dependencies, as well as Alteryx SDK's dependencies.

## Activating Your Environment

After you have run the script, make sure you are in the pilot directory of the snakeplane folder. Then run the following command in Powershell:

`.\env\Scripts\activate.ps1`

or for Command Prompt:

`.\env\Scripts\activate.bat`

You should now see that your terminal is preceded by `(env)`.

Always activate your environment before attempting to use the invoke commands.

