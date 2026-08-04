@echo off
chcp 65001 > nul
title LinkedIn MCP - Login Manual

cd /d "C:\Users\MaykonSilva\OneDrive - C&M SOFTWARE LICENCIAMENTO DE SISTEMAS LTDA\Área de Trabalho\Arquivos Gerais\Linkedin"

echo ============================================
echo    LinkedIn MCP - Renovação de Sessão
echo ============================================
echo.

npm run login

pause
