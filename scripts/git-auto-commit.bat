@echo off
chcp 65001 > nul

REM 云边小铺 - 自动 Git 提交脚本 (Windows)

echo ======================================
echo     云边小铺 - Git 自动提交脚本
echo ======================================
echo.

REM 获取提交消息
set COMMIT_MSG=%1
if "%COMMIT_MSG%"=="" set COMMIT_MSG=更新 %date% %time%

REM 检查 git 是否安装
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误: Git 未安装
    exit /b 1
)

REM 检查是否为 git 仓库
if not exist ".git" (
    echo 错误: 当前目录不是 Git 仓库
    exit /b 1
)

REM 显示当前状态
echo 📊 当前状态:
git status --short
echo.

REM 检查是否有更改
for /f %%i in ('git diff --quiet ^&^& git diff --cached --quiet ^&^& echo empty') do (
    if "%%i"=="empty" (
        echo ⚠️  没有检测到更改，无需提交
        exit /b 0
    )
)

REM 添加所有更改
echo 📦 添加更改...
git add -A

REM 显示暂存的文件
echo.
echo 📁 暂存的文件:
git diff --cached --name-only
echo.

REM 提交
echo ✓ 提交更改...
git commit -m "%COMMIT_MSG%"

REM 显示提交结果
echo.
echo ✅ 提交成功!
echo 📋 最近提交:
git log -1 --oneline

echo.
set /p PUSH="是否推送到远程仓库? (y/n): "
if /i "%PUSH%"=="y" (
    echo.
    echo 🚀 推送中...
    git push
    echo ✅ 推送成功!
)

echo.
echo ======================================
pause
