import torch
from torch import nn
from myapp.constants import CLASSES


class DigitCNN(nn.Module):
    def __init__(
        self,
        channels=(16, 32),
        hidden_size=64,
        dropout=0.0,
        num_classes=47
    ):
        super().__init__()

        feature_layers = []

        in_channels = 1
        image_size = 28

        for out_channels in channels:
            feature_layers.extend([
                nn.Conv2d(
                    in_channels=in_channels,
                    out_channels=out_channels,
                    kernel_size=3,
                    padding=1
                ),
                nn.BatchNorm2d(out_channels),
                nn.ReLU(),
                nn.MaxPool2d(2)
            ])

            in_channels = out_channels
            image_size //= 2

        self.features = nn.Sequential(*feature_layers)

        flattened_size = (
            in_channels * image_size * image_size
        )

        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(flattened_size, hidden_size),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)

        return x


class Model:

    def __init__(self):
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        checkpoint = torch.load(
            "myapp/model.ckpt",
            map_location=self.device
        )

        config = checkpoint["config"]

        self.model = DigitCNN(
            channels=config["channels"],
            hidden_size=config["hidden_size"],
            dropout=config["dropout"]
        ).to(self.device)

        self.model.load_state_dict(
            checkpoint["model_state_dict"]
        )

        self.model.eval()

    def predict(self, data):
        data = data.float()
        data = data / 255.0
        data = (data - 0.5) / 0.5
        data = data.unsqueeze(0).unsqueeze(0)
        data = data.to(self.device)

        with torch.inference_mode():
            output = self.model(data)
            pred = output.argmax(dim=1)

        class_id = pred.item()
        return CLASSES[class_id]
