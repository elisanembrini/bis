import { AspectRatio, Image, Text } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { FullBleed, PageContainer } from "./PageContainer";
import { dishImage } from "./storyImages";

const meta = {
  component: PageContainer,
  args: { children: null },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageContainer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithFullBleedImage: Story = {
  render: () => (
    <PageContainer>
      <FullBleed>
        <AspectRatio ratio={16 / 10}>
          <Image src={dishImage} alt="Foto a tutta larghezza" radius={0} fit="cover" />
        </AspectRatio>
      </FullBleed>
      <Text mt="md">Il testo resta dentro i margini della pagina.</Text>
    </PageContainer>
  ),
  play: async ({ canvas }) => {
    const text = await canvas.findByText("Il testo resta dentro i margini della pagina.");
    const image = canvas.getByRole("img", { name: "Foto a tutta larghezza" });
    await expect(image.getBoundingClientRect().left).toBeLessThan(
      text.getBoundingClientRect().left,
    );
  },
};
