@echo off
cd /d "%~dp0"

echo.
echo === RoadPilot Driver App Demo (http://localhost:5183) ===
echo.
echo This is a separate, standalone app. It does not modify RoadPilot itself.
echo Make sure RoadPilot's backend (3-backend.bat) and simulation engine
echo (5-simulation-engine.bat) are already running before you continue,
echo or this app will have no real data to show.
echo.

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto :error
)

echo.
echo Starting the driver app. Leave this window open while using it. Press Ctrl+C to stop.
echo Reads real data from the RoadPilot backend on :8787.
echo.
call npm run dev

echo.
echo Driver app stopped.
pause
exit /b 0

:error
echo.
echo npm install failed - see the error message above.
pause
exit /b 1
