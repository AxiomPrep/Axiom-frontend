@echo off
cd /d "%~dp0.."
curl -s -o nul -w "privacy:%{http_code} " "http://127.0.0.1:3000/privacy"
curl -s -o nul -w "terms:%{http_code} " "http://127.0.0.1:3000/terms"
curl -s -o nul -w "refund:%{http_code} " "http://127.0.0.1:3000/refund"
curl -s -o nul -w "policies:%{http_code} " "http://127.0.0.1:3000/policies"
echo.
curl -s -X POST "http://127.0.0.1:3000/catalog/policy-acceptances" -H "Content-Type: application/json" -d "{\"email\":\"test@axiom.app\",\"name\":\"Test Student\",\"planId\":\"plan-1\",\"planName\":\"NEET Gold\",\"track\":\"neet\",\"termsAccepted\":true,\"refundAccepted\":true,\"privacyAcknowledged\":true}"
echo.
curl -s "http://127.0.0.1:3000/catalog/policy-acceptances?email=test@axiom.app"
echo.
