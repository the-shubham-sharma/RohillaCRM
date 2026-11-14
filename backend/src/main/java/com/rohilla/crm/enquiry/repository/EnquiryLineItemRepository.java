package com.rohilla.crm.enquiry.repository;

import com.rohilla.crm.enquiry.entity.EnquiryLineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EnquiryLineItemRepository extends JpaRepository<EnquiryLineItem, UUID> {
    List<EnquiryLineItem> findByEnquiryId(UUID enquiryId);
}
