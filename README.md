PJSR - PixInsight JavaScript Runtime

The PixInsight JavaScript Runtime (PJSR) is an ECMA 262-5 compliant environment readily available in the PixInsight Core application. PJSR is based on a custom embedding of the SpiderMonkey JavaScript engine by Mozilla Corporation. The current versions 1.8.x of PixInsight use the latest SpiderMonkey 24 engine.

PJSR allows advanced users to create their own tools to meet their specific needs, try out new algorithms, generate high-quality graphics, and perform complex tasks involving thousands of images. Many scripts already form part of the standard PixInsight distribution to implement mission-critical tasks such as batch image preprocessing, batch image analysis, image grading, plate solving, image annotation and 3-D rendering, just to name some well-known examples. Scripts are smoothly integrated with the whole PixInsight platform: all installed processes are automatically scriptable. You can apply any sequence of processes to an image, extract its processing history, and generate a script automatically with just a couple clicks.

This repository contains the source code of a number of important scripts that form part of the standard PixInsight distribution on all platforms, including BatchPreprocessing, the PIDoc compiler, Makefile Generator, and other critical components.
