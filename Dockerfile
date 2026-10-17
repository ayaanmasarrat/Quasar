# Standard-library Python keeps the starter independent of compiled ML/GIS wheels.
# Verify this image tag and the build on the team's actual IBM Z environment.
FROM python:3.12-slim
WORKDIR /app
COPY quasar /app/quasar
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
USER 10001:10001
EXPOSE 8000
CMD ["python", "-m", "quasar", "--host", "0.0.0.0", "--port", "8000"]
