package com.rohilla.crm.enquiry.service;

import com.rohilla.crm.enquiry.dto.ServiceCatalogDto;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class ServiceCatalogService {

    private final Map<String, ServiceCatalogDto> catalog = new ConcurrentHashMap<>();

    private static final List<String> ALL_FINISHING_OPTIONS = List.of(
            "Eyelets",
            "Rope",
            "Edge Folding",
            "Reinforcement",
            "Lamination",
            "Mounting",
            "Frame Fabrication",
            "Welding",
            "Painting",
            "LED Lighting",
            "Electrical Work",
            "Transportation",
            "On-Site Installation",
            "Crane/Hydraulic Lift Required",
            "Civil/Foundation Work",
            "Site Inspection Required"
    );

    @PostConstruct
    public void init() {
        // 1. Flex Printing
        addService(ServiceCatalogDto.builder()
                .serviceName("Flex Printing")
                .materials(new ArrayList<>(List.of(
                        "Frontlit Flex", "Backlit Flex", "Star Flex", "Blackback Flex",
                        "Blockout Flex", "Translucent Flex", "Mesh Flex", "Self-Adhesive Vinyl",
                        "Reflective Vinyl", "One-Way Vision Film", "Lamination Film",
                        "Eyelets/Grommets", "Rope", "Edge Reinforcement Tape",
                        "Material to be confirmed by Manager/Designer"
                )))
                .finishingOptions(List.of("Eyelets", "Rope", "Edge Folding", "Reinforcement", "Lamination", "Transportation", "On-Site Installation"))
                .defaultUnits(List.of("Sq. Ft.", "Piece", "Running Ft."))
                .build());

        // 2. Hoarding
        addService(ServiceCatalogDto.builder()
                .serviceName("Hoarding")
                .materials(new ArrayList<>(List.of(
                        "Frontlit/Backlit Flex", "MS Square Pipe", "MS Rectangular Pipe", "MS Angle",
                        "MS Channel", "MS Beam", "MS Plate and Base Plate", "Gusset Plate",
                        "Nuts and Bolts", "Anchor Bolts", "Welding Electrodes", "Primer and Paint",
                        "Lighting Materials", "Installation Hardware",
                        "Material to be confirmed by Manager/Designer"
                )))
                .finishingOptions(List.of("Frame Fabrication", "Welding", "Painting", "LED Lighting", "Electrical Work", "Transportation", "On-Site Installation", "Crane/Hydraulic Lift Required", "Civil/Foundation Work", "Site Inspection Required"))
                .defaultUnits(List.of("Sq. Ft.", "Piece", "Set"))
                .build());

        // 3. Gantry
        addService(ServiceCatalogDto.builder()
                .serviceName("Gantry")
                .materials(new ArrayList<>(List.of(
                        "Frontlit/Backlit Flex", "MS Square Pipe", "MS Rectangular Pipe", "MS Angle",
                        "MS Channel", "MS Beam", "MS Plate and Base Plate", "Gusset Plate",
                        "Nuts and Bolts", "Anchor Bolts", "Welding Electrodes", "Primer and Paint",
                        "Lighting Materials", "Installation Hardware",
                        "Material to be confirmed by Manager/Designer"
                )))
                .finishingOptions(List.of("Frame Fabrication", "Welding", "Painting", "LED Lighting", "Electrical Work", "Transportation", "On-Site Installation", "Crane/Hydraulic Lift Required", "Civil/Foundation Work", "Site Inspection Required"))
                .defaultUnits(List.of("Sq. Ft.", "Piece", "Set"))
                .build());

        // 4. Unipole
        addService(ServiceCatalogDto.builder()
                .serviceName("Unipole")
                .materials(new ArrayList<>(List.of(
                        "Frontlit/Backlit Flex", "High Mast Pole / Heavy MS Pipe", "Heavy Base Plate",
                        "Anchor Cage / Foundation Bolts", "MS Channel & Truss", "Welding Electrodes",
                        "Primer and Paint", "High Power LED Floodlights", "Installation Hardware",
                        "Material to be confirmed by Manager/Designer"
                )))
                .finishingOptions(List.of("Civil/Foundation Work", "Frame Fabrication", "Welding", "Painting", "LED Lighting", "Electrical Work", "Crane/Hydraulic Lift Required", "On-Site Installation", "Site Inspection Required"))
                .defaultUnits(List.of("Sq. Ft.", "Piece", "Set"))
                .build());

        // 5. Bus Shelter Advertising
        addService(ServiceCatalogDto.builder()
                .serviceName("Bus Shelter Advertising")
                .materials(new ArrayList<>(List.of(
                        "Frontlit/Backlit Flex", "Backlit Fabric", "Printable Vinyl", "ACP Sheet",
                        "Acrylic Sheet", "Polycarbonate Sheet", "Aluminium Profile", "MS/GI Frame",
                        "LED Modules and Drivers", "Electrical Wire", "Mounting Brackets",
                        "Material to be confirmed by Manager/Designer"
                )))
                .finishingOptions(List.of("Frame Fabrication", "Lamination", "Mounting", "LED Lighting", "Electrical Work", "Transportation", "On-Site Installation", "Site Inspection Required"))
                .defaultUnits(List.of("Sq. Ft.", "Piece", "Set"))
                .build());

        // 6. Standee
        addService(ServiceCatalogDto.builder()
                .serviceName("Standee")
                .materials(new ArrayList<>(List.of(
                        "Flex", "Backlit Flex", "Printable Vinyl", "Sunboard", "PVC Foam Board",
                        "Roll-up Standee Mechanism", "X-Banner Stand", "Aluminium Stand",
                        "Material to be confirmed by Manager/Designer"
                )))
                .finishingOptions(List.of("Lamination", "Mounting", "Transportation"))
                .defaultUnits(List.of("Piece", "Set"))
                .build());

        // 7. Sign Board
        addService(ServiceCatalogDto.builder()
                .serviceName("Sign Board")
                .materials(new ArrayList<>(List.of(
                        "ACP Sheet", "Acrylic Sheet", "PVC Foam Board", "Aluminium Profile",
                        "MS Frame", "Stainless Steel/Acrylic Letters", "LED Modules", "LED Drivers",
                        "Electrical Wire", "Vinyl Graphics", "Mounting Hardware",
                        "Material to be confirmed by Manager/Designer"
                )))
                .finishingOptions(List.of("Frame Fabrication", "Welding", "Painting", "Mounting", "LED Lighting", "Electrical Work", "Transportation", "On-Site Installation"))
                .defaultUnits(List.of("Sq. Ft.", "Piece", "Set"))
                .build());

        // 8. ACP Signage
        addService(ServiceCatalogDto.builder()
                .serviceName("ACP Signage")
                .materials(new ArrayList<>(List.of(
                        "ACP Sheet (3mm/4mm)", "Acrylic Sheet (3mm/5mm)", "PVC Foam Board",
                        "Aluminium Profile", "MS Frame Pipe", "LED Modules IP68", "LED Drivers (Meanwell)",
                        "Electrical Wire", "Vinyl Graphics", "Mounting Hardware",
                        "Material to be confirmed by Manager/Designer"
                )))
                .finishingOptions(List.of("Frame Fabrication", "Welding", "Painting", "Mounting", "LED Lighting", "Electrical Work", "Transportation", "On-Site Installation", "Crane/Hydraulic Lift Required"))
                .defaultUnits(List.of("Sq. Ft.", "Piece", "Set"))
                .build());

        // 9. LED Board
        addService(ServiceCatalogDto.builder()
                .serviceName("LED Board")
                .materials(new ArrayList<>(List.of(
                        "P10 Outdoor LED Modules", "P4/P5 Indoor LED Modules", "LED Power Supplies (5V 40A)",
                        "Asynchronous/Synchronous Control Card", "Aluminium Extrusion Cabinet",
                        "Waterproof Gaskets & Sealant", "Flat Ribbon Cables & Power Wiring", "Mounting Brackets",
                        "Material to be confirmed by Manager/Designer"
                )))
                .finishingOptions(List.of("Frame Fabrication", "LED Lighting", "Electrical Work", "Mounting", "Transportation", "On-Site Installation"))
                .defaultUnits(List.of("Sq. Ft.", "Piece", "Set"))
                .build());

        // 10. Vinyl Printing
        addService(ServiceCatalogDto.builder()
                .serviceName("Vinyl Printing")
                .materials(new ArrayList<>(List.of(
                        "Printable Vinyl (Gloss/Matte)", "Clear Transparent Vinyl", "Frosted Glass Vinyl",
                        "Cast Vehicle Wrap Vinyl", "Reflective Vinyl", "One-Way Vision Film",
                        "Cold Lamination Film", "Application / Transfer Tape", "Sunboard (3mm/5mm)",
                        "Material to be confirmed by Manager/Designer"
                )))
                .finishingOptions(List.of("Lamination", "Mounting", "Transportation", "On-Site Installation"))
                .defaultUnits(List.of("Sq. Ft.", "Piece", "Running Ft."))
                .build());

        // 11. Banner Printing
        addService(ServiceCatalogDto.builder()
                .serviceName("Banner Printing")
                .materials(new ArrayList<>(List.of(
                        "Frontlit Flex 340gsm/440gsm", "Star Flex", "Canvas Fabric", "Satin Fabric",
                        "Mesh Banner", "Brass Eyelets", "Pole Pockets", "Hemming Tape", "Nylon Rope",
                        "Material to be confirmed by Manager/Designer"
                )))
                .finishingOptions(List.of("Eyelets", "Rope", "Edge Folding", "Reinforcement", "Transportation"))
                .defaultUnits(List.of("Sq. Ft.", "Piece", "Running Ft."))
                .build());

        // 12. Poster Printing
        addService(ServiceCatalogDto.builder()
                .serviceName("Poster Printing")
                .materials(new ArrayList<>(List.of(
                        "Photo Gloss Paper", "Synthetic Non-Tearable Paper", "Art Card 300gsm",
                        "Matte Coated Paper", "Foam Board / Sunboard 5mm", "Thermal Lamination Film",
                        "Aluminium Snapper Frame",
                        "Material to be confirmed by Manager/Designer"
                )))
                .finishingOptions(List.of("Lamination", "Mounting", "Transportation"))
                .defaultUnits(List.of("Piece", "Sq. Ft."))
                .build());

        // 13. Other
        addService(ServiceCatalogDto.builder()
                .serviceName("Other")
                .materials(new ArrayList<>(List.of(
                        "Material to be confirmed by Manager/Designer",
                        "Custom Structural Material",
                        "Custom Print Media",
                        "Custom Acrylic / Metal Fabrication"
                )))
                .finishingOptions(ALL_FINISHING_OPTIONS)
                .defaultUnits(List.of("Piece", "Sq. Ft.", "Set", "Other"))
                .build());
    }

    public List<ServiceCatalogDto> getAllServices() {
        return new ArrayList<>(catalog.values());
    }

    public ServiceCatalogDto getService(String name) {
        return catalog.get(name);
    }

    public void addService(ServiceCatalogDto dto) {
        if (dto != null && dto.getServiceName() != null) {
            catalog.put(dto.getServiceName(), dto);
        }
    }

    public void addMaterialToService(String serviceName, String materialName) {
        ServiceCatalogDto dto = catalog.get(serviceName);
        if (dto != null && !dto.getMaterials().contains(materialName)) {
            dto.getMaterials().add(materialName);
        }
    }

    public List<String> getAllFinishingOptions() {
        return ALL_FINISHING_OPTIONS;
    }
}
