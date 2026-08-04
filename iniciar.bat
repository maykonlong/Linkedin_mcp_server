@echo off
chcp 65001 > nul
title LinkedIn MCP Server

:: Navega para o diretório do projeto
cd /d "C:\Users\MaykonSilva\OneDrive - C&M SOFTWARE LICENCIAMENTO DE SISTEMAS LTDA\Área de Trabalho\Arquivos Gerais\Linkedin"

echo ============================================
echo    LinkedIn MCP Server - Inicializando
echo ============================================
echo.

:: Verifica se .env ou conf.ini existe
if not exist ".env" if not exist "conf.ini" (
    echo [ERRO] Nem .env nem conf.ini encontrados!
    echo Crie o arquivo .env baseado no .env.example
    pause
    exit /b 1
)

:: Verifica se as credenciais foram preenchidas
setlocal enabledelayedexpansion
set EMAIL_OK=0
set PASS_OK=0
for /f "usebackq tokens=1,2 delims==" %%a in ("conf.ini") do (
    set "key=%%a"
    set "value=%%b"
    if "!key!"=="email" if not "!value!"=="SEU_EMAIL_AQUI" set EMAIL_OK=1
    if "!key!"=="password" if not "!value!"=="SUA_SENHA_AQUI" set PASS_OK=1
)
endlocal & set EMAIL_OK=%EMAIL_OK% & set PASS_OK=%PASS_OK%

if %EMAIL_OK%==0 (
    echo [ERRO] Email nao configurado em conf.ini!
    echo Edite o arquivo conf.ini e preencha seu email e senha.
    pause
    exit /b 1
)
if %PASS_OK%==0 (
    echo [ERRO] Senha nao configurada em conf.ini!
    echo Edite o arquivo conf.ini e preencha seu email e senha.
    pause
    exit /b 1
)

echo [OK] Credenciais verificadas em conf.ini

:: Verifica se node_modules existe
if not exist "node_modules" (
    echo [ERRO] node_modules não encontrado!
    echo Execute: npm install
    pause
    exit /b 1
)

:: Compila TypeScript
echo [INFO] Compilando TypeScript...
node .\node_modules\typescript\bin\tsc
if %errorlevel% neq 0 (
    echo [ERRO] Falha na compilação TypeScript!
    pause
    exit /b 1
)
echo [OK] Compilação concluída!

:: Verifica se o Chromium do Playwright está instalado
dir /b "%LOCALAPPDATA%\ms-playwright\chromium-*" > nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Chromium nao encontrado. Instalando...
    node .\node_modules\playwright\cli.js install chromium
    if %errorlevel% neq 0 (
        echo [AVISO] Falha ao instalar o Chromium via CLI.
        echo [INFO] Tentando via npx...
        npx playwright install chromium
        if %errorlevel% neq 0 (
            echo [ERRO] Nao foi possivel instalar o Chromium!
            echo Verifique sua conexao ou instale manualmente com:
            echo   npx playwright install chromium
            pause
            exit /b 1
        )
    )
    echo [OK] Chromium instalado!
) else (
    echo [OK] Chromium ja esta instalado!
)

echo.
echo [OK] Iniciando LinkedIn MCP Server...
echo.

:: Executa o MCP server
node build\index.js

pause