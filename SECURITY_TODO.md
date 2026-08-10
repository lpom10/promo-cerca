# SECURITY TODO

Este repositorio requiere una limpieza manual del historial de git porque `.env` quedó expuesto.

1. Instalar git-filter-repo:
   - `pip install git-filter-repo`
   - o en Mac: `brew install git-filter-repo`
2. Ejecutar:
   - `git filter-repo --path .env --invert-paths --force`
3. Si el repo ya tiene remote:
   - `git push origin --force --all`
   - `git push origin --force --tags`
4. Ir a Firebase Console → Project Settings → General → regenerar/restringir la API key (Web API Key) por si acaso, aunque el riesgo real depende de las Security Rules.
5. Confirmar que `.gitignore` siga conteniendo `.env*` y que no se vuelva a incluir `.git/` ni `.env` dentro de futuros `.zip` de entrega.
