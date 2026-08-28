import torch

from fastapi import FastAPI, Body
from fastapi.staticfiles import StaticFiles
from myapp.model import Model


model = Model()

app = FastAPI(
    title="Symbol detection",
    docs_url="/docs"
)


@app.post("/api/predict")
def predict(
    image: list[int] = Body(
        ...,
        description="784 image pixels"
    )
):
    if len(image) != 28 * 28:
        return {
            "error": "Expected 784 pixels"
        }

    image = torch.tensor(
        image,
        dtype=torch.float32
    ).reshape(28, 28)

    pred = model.predict(image)

    return {
        "prediction": pred
    }


app.mount(
    "/",
    StaticFiles(
        directory="static",
        html=True
    ),
    name="static"
)